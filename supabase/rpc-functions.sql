-- ==============================================================================
-- SALIMNA PLATFORM - RPC FUNCTIONS (checkout & order management)
-- ==============================================================================
-- File ini HANYA membuat fungsi RPC + reload schema cache.
-- TIDAK berisi seed data, jadi aman dijalankan pada database yang sudah berisi
-- produk/artikel tanpa memunculkan order sampel.
--
-- Cara pakai:
-- 1. Buka Supabase Dashboard -> SQL Editor -> New query.
-- 2. Tempel seluruh isi file ini, lalu klik "Run".
-- 3. Selesai. Fungsi akan langsung terdeteksi oleh API (lihat NOTIFY di akhir).
-- ==============================================================================

-- 1. CHECKOUT: buat pesanan + kurangi stok secara atomik
CREATE OR REPLACE FUNCTION public.create_order_with_stock(p_order JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_item JSONB;
  product_row public.products%ROWTYPE;
  order_row public.orders%ROWTYPE;
  item_id BIGINT;
  item_quantity INTEGER;
  order_items JSONB := '[]'::jsonb;
  order_total BIGINT := 0;
BEGIN
  IF jsonb_typeof(p_order->'items') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_order->'items') < 1
    OR jsonb_array_length(p_order->'items') > 50 THEN
    RAISE EXCEPTION 'Item pesanan tidak valid';
  END IF;

  FOR requested_item IN SELECT value FROM jsonb_array_elements(p_order->'items')
  LOOP
    item_id := (requested_item->>'id')::BIGINT;
    item_quantity := (requested_item->>'qty')::INTEGER;

    IF item_id < 1 OR item_quantity < 1 OR item_quantity > 99 THEN
      RAISE EXCEPTION 'Item pesanan tidak valid';
    END IF;

    SELECT * INTO product_row
    FROM public.products
    WHERE id = item_id AND is_active = 1
    FOR UPDATE;

    IF NOT FOUND OR COALESCE(product_row.stock, 0) < item_quantity OR product_row.price < 0 THEN
      RAISE EXCEPTION 'Produk tidak tersedia atau stok tidak mencukupi';
    END IF;

    UPDATE public.products
    SET stock = stock - item_quantity, updated_at = now()
    WHERE id = item_id;

    order_total := order_total + product_row.price * item_quantity;
    order_items := order_items || jsonb_build_array(jsonb_build_object(
      'id', product_row.id,
      'name', product_row.name,
      'price', product_row.price,
      'qty', item_quantity,
      'size', COALESCE(requested_item->>'size', '')
    ));
  END LOOP;

  INSERT INTO public.orders (
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    items,
    total_amount,
    status,
    notes
  )
  VALUES (
    p_order->>'order_number',
    p_order->>'customer_name',
    COALESCE(p_order->>'customer_email', ''),
    p_order->>'customer_phone',
    p_order->>'shipping_address',
    order_items,
    order_total,
    'pending',
    COALESCE(p_order->>'notes', '')
  )
  RETURNING * INTO order_row;

  RETURN to_jsonb(order_row);
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_stock(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock(JSONB) TO service_role;

-- 2. UPDATE STATUS: kelola stok saat pesanan dibatalkan/dibuka kembali
CREATE OR REPLACE FUNCTION public.update_order_status_with_stock(p_order_id BIGINT, p_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  requested_item JSONB;
  product_row public.products%ROWTYPE;
  item_id BIGINT;
  item_quantity INTEGER;
BEGIN
  IF p_status NOT IN ('pending', 'confirmed', 'shipped', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Status pesanan tidak valid';
  END IF;

  SELECT * INTO order_row
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF order_row.status <> p_status AND p_status = 'cancelled' THEN
    FOR requested_item IN SELECT value FROM jsonb_array_elements(order_row.items)
    LOOP
      UPDATE public.products
      SET stock = stock + (requested_item->>'qty')::INTEGER, updated_at = now()
      WHERE id = (requested_item->>'id')::BIGINT;
    END LOOP;
  ELSIF order_row.status = 'cancelled' AND p_status <> 'cancelled' THEN
    FOR requested_item IN SELECT value FROM jsonb_array_elements(order_row.items)
    LOOP
      item_id := (requested_item->>'id')::BIGINT;
      item_quantity := (requested_item->>'qty')::INTEGER;

      SELECT * INTO product_row
      FROM public.products
      WHERE id = item_id
      FOR UPDATE;

      IF NOT FOUND OR COALESCE(product_row.stock, 0) < item_quantity THEN
        RAISE EXCEPTION 'Produk tidak tersedia atau stok tidak mencukupi untuk membuka kembali pesanan';
      END IF;

      UPDATE public.products
      SET stock = stock - item_quantity, updated_at = now()
      WHERE id = item_id;
    END LOOP;
  END IF;

  UPDATE public.orders
  SET status = p_status, updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO order_row;

  RETURN to_jsonb(order_row);
END;
$$;

REVOKE ALL ON FUNCTION public.update_order_status_with_stock(BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status_with_stock(BIGINT, TEXT) TO service_role;

-- 3. HAPUS PESANAN: hanya boleh untuk pesanan selesai/dibatalkan
CREATE OR REPLACE FUNCTION public.delete_closed_order(p_order_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
BEGIN
  SELECT * INTO order_row
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF order_row.status NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Pesanan harus selesai atau dibatalkan sebelum dihapus';
  END IF;

  DELETE FROM public.orders WHERE id = p_order_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_closed_order(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_closed_order(BIGINT) TO service_role;

-- Reload schema cache PostgREST agar fungsi langsung dikenali API
NOTIFY pgrst, 'reload schema';
