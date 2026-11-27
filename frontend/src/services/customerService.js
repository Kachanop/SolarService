import { supabase } from '../lib/supabase.js';

function requireSupabase() {
  if (!supabase) throw new Error('กรุณาตั้งค่า Supabase ก่อนใช้งาน');
  return supabase;
}

async function getUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('กรุณาเข้าสู่ระบบ');
  return data.user;
}

export async function getMyOrders() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('orders')
    .select('*,order_items(id,product_name,unit_price,quantity,line_total),order_installments(id,installment_number,amount,due_date,status,paid_at)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyQuotes() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('quotations')
    .select('*,quotation_items(*)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getQuotationByOrderId(orderId) {
  if (!supabase || !orderId) return null;
  const { data, error } = await supabase
    .from('quotations')
    .select('id,quote_number,status,valid_until,net_total,total')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function respondToQuote(quoteId, accepted) {
  await getUser();
  const { error } = await supabase.rpc('respond_to_quotation', {
    p_quotation_id: quoteId,
    p_accept: accepted,
  });
  if (error) throw error;
}

export async function getMyInstallations() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('installations')
    .select('*,service_bookings(id,booking_number,address,province,preferred_at)')
    .eq('customer_id', user.id)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyWarranties() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('warranties')
    .select('*')
    .eq('customer_id', user.id)
    .order('warranty_end', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyMaintenance() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('maintenance_reminders')
    .select('*')
    .eq('customer_id', user.id)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getMyTickets() {
  const user = await getUser();
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  if (!tickets?.length) return { tickets: [], historyError: '' };

  const { data: events, error: eventsError } = await supabase
    .from('support_ticket_events')
    .select('id,ticket_id,old_status,new_status,note,created_at')
    .in('ticket_id', tickets.map((ticket) => ticket.id))
    .order('created_at', { ascending: true });

  if (eventsError) {
    const message = [eventsError.message, eventsError.details].filter(Boolean).join(' ');
    if (/support_ticket_events/i.test(message)
      && /(does not exist|not found|schema cache|could not find)/i.test(message)) {
      console.error('Repair ticket history is unavailable; apply migration 20261128000000_customer_sales_workflows.sql:', eventsError);
      return {
        tickets: tickets.map((ticket) => ({ ...ticket, support_ticket_events: [] })),
        historyError: 'รายการแจ้งซ่อมแสดงได้แล้ว แต่ประวัติสถานะยังไม่พร้อม กรุณาติดตั้ง migration 20261128000000_customer_sales_workflows.sql ใน Supabase',
      };
    }
    throw eventsError;
  }

  const eventsByTicketId = new Map();
  for (const event of events || []) {
    const ticketEvents = eventsByTicketId.get(event.ticket_id) || [];
    ticketEvents.push(event);
    eventsByTicketId.set(event.ticket_id, ticketEvents);
  }

  return {
    tickets: tickets.map((ticket) => ({
      ...ticket,
      support_ticket_events: eventsByTicketId.get(ticket.id) || [],
    })),
    historyError: '',
  };
}

export async function createRepairTicket({ title, description, category, priority, warrantyId }) {
  const user = await getUser();
  const payload = {
    customer_id: user.id,
    title: title.trim(),
    description: description.trim(),
    category,
    priority,
  };
  if (warrantyId) payload.warranty_id = warrantyId;
  const { data, error } = await supabase
    .from('support_tickets')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getMyCompletedReviewableOrderItems() {
  const user = await getUser();
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('id,product_id,package_id,product_name,unit_price,quantity,line_total,created_at,products(name,category,description,image_url,sku),orders!inner(id,order_number,status,customer_id,created_at)')
    .eq('orders.customer_id', user.id)
    .eq('orders.status', 'completed')
    .not('product_id', 'is', null)
    .is('package_id', null)
    .order('created_at', { ascending: false });
  if (orderItemsError) throw orderItemsError;
  const items = orderItems || [];
  if (!items.length) return [];

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('order_item_id')
    .in('order_item_id', items.map((item) => item.id));
  if (error) throw error;
  const reviewed = new Set((reviews || []).map((item) => item.order_item_id));
  return items.filter((item) => !reviewed.has(item.id));
}

export async function getMyReviews() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('reviews')
    .select('*,installations(id,installation_number,booking_id,quotation_id)')
    .eq('customer_id', user.id)
    .not('order_item_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const reviews = data || [];
  const orderItemIds = [...new Set(reviews.map((review) => review.order_item_id).filter(Boolean))];
  const quotationItemIds = [...new Set(reviews.map((review) => review.quotation_item_id).filter(Boolean))];
  const installations = reviews.map((review) => review.installations).filter(Boolean);
  const installationIds = [...new Set(installations.map((item) => item.id))];
  const missingQuoteBookingIds = [...new Set(
    installations.filter((item) => !item.quotation_id).map((item) => item.booking_id).filter(Boolean),
  )];
  const [orderItemsResult, quotationItemsResult, fallbackQuotesResult, warrantiesResult] = await Promise.all([
    orderItemIds.length
      ? supabase.from('order_items')
        .select('id,product_id,package_id,product_name,unit_price,quantity,line_total,products(name,category,description,image_url,sku),orders(order_number,created_at)')
        .in('id', orderItemIds)
      : Promise.resolve({ data: [], error: null }),
    quotationItemIds.length
      ? supabase.from('quotation_items')
        .select('id,product_id,description,quantity,unit_price,line_total,quotation_id')
        .in('id', quotationItemIds)
      : Promise.resolve({ data: [], error: null }),
    missingQuoteBookingIds.length
      ? supabase.from('quotations')
        .select('id,booking_id,quote_number')
        .eq('customer_id', user.id)
        .eq('status', 'approved')
        .in('booking_id', missingQuoteBookingIds)
        .order('updated_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    installationIds.length
      ? supabase.from('warranties')
        .select('id,installation_id,product_id,equipment_type,equipment_model,warranty_number,warranty_end')
        .in('installation_id', installationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (orderItemsResult.error) throw orderItemsResult.error;
  if (quotationItemsResult.error) throw quotationItemsResult.error;
  if (fallbackQuotesResult.error) throw fallbackQuotesResult.error;
  if (warrantiesResult.error) throw warrantiesResult.error;

  const fallbackQuotesByBooking = new Map();
  (fallbackQuotesResult.data || []).forEach((quote) => {
    if (!fallbackQuotesByBooking.has(quote.booking_id)) fallbackQuotesByBooking.set(quote.booking_id, quote);
  });
  const quoteByInstallation = new Map(installations.map((installation) => [
    installation.id,
    installation.quotation_id
      ? { id: installation.quotation_id, quote_number: '' }
      : fallbackQuotesByBooking.get(installation.booking_id),
  ]));
  const installationQuoteIds = [...new Set([...quoteByInstallation.values()].map((quote) => quote?.id).filter(Boolean))];
  const quoteIds = [...new Set([
    ...installationQuoteIds,
    ...(quotationItemsResult.data || []).map((item) => item.quotation_id),
  ])];
  const [installationItemsResult, quoteDetailsResult] = await Promise.all([
    installationQuoteIds.length
      ? supabase.from('quotation_items')
        .select('id,product_id,description,quantity,unit_price,line_total,quotation_id')
        .in('quotation_id', installationQuoteIds)
      : Promise.resolve({ data: [], error: null }),
    quoteIds.length
      ? supabase.from('quotations').select('id,quote_number').in('id', quoteIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (installationItemsResult.error) throw installationItemsResult.error;
  if (quoteDetailsResult.error) throw quoteDetailsResult.error;

  const allQuotationItems = [
    ...(quotationItemsResult.data || []),
    ...(installationItemsResult.data || []),
  ];
  const productIds = [...new Set([
    ...allQuotationItems.map((item) => item.product_id),
    ...(warrantiesResult.data || []).map((item) => item.product_id),
    ...(orderItemsResult.data || []).map((item) => item.product_id),
  ].filter(Boolean))];
  const warrantyModels = [...new Set((warrantiesResult.data || [])
    .filter((item) => !item.product_id && item.equipment_model)
    .map((item) => item.equipment_model))];
  const [productsResult, productsByNameResult, productsBySkuResult] = await Promise.all([
    productIds.length
      ? supabase.from('products').select('id,name,category,description,image_url,sku').in('id', productIds)
      : Promise.resolve({ data: [], error: null }),
    warrantyModels.length
      ? supabase.from('products').select('id,name,category,description,image_url,sku').in('name', warrantyModels)
      : Promise.resolve({ data: [], error: null }),
    warrantyModels.length
      ? supabase.from('products').select('id,name,category,description,image_url,sku').in('sku', warrantyModels)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (productsResult.error) throw productsResult.error;
  if (productsByNameResult.error) throw productsByNameResult.error;
  if (productsBySkuResult.error) throw productsBySkuResult.error;

  const allProducts = [
    ...(productsResult.data || []),
    ...(productsByNameResult.data || []),
    ...(productsBySkuResult.data || []),
  ];
  const productsById = new Map(allProducts.map((item) => [item.id, item]));
  const productsByModel = new Map(allProducts.flatMap((item) => [
    [item.name, item],
    ...(item.sku ? [[item.sku, item]] : []),
  ]));
  const orderItemsById = new Map((orderItemsResult.data || []).map((item) => [
    item.id,
    {
      ...item,
      products: item.products || productsById.get(item.product_id) || null,
    },
  ]));
  const quotationItemsById = new Map(allQuotationItems.map((item) => [
    item.id,
    {
      ...item,
      products: productsById.get(item.product_id) || null,
      product_name: productsById.get(item.product_id)?.name || item.description,
    },
  ]));
  const quoteNumbersById = new Map((quoteDetailsResult.data || []).map((item) => [item.id, item.quote_number]));
  const installationsByQuoteId = new Map(
    installations
      .map((installation) => [quoteByInstallation.get(installation.id)?.id, installation])
      .filter(([quoteId]) => quoteId),
  );
  const installationProductsById = new Map();
  (installationItemsResult.data || []).forEach((item) => {
    const installationId = installationsByQuoteId.get(item.quotation_id)?.id;
    if (!installationId) return;
    if (!installationProductsById.has(installationId)) installationProductsById.set(installationId, []);
    installationProductsById.get(installationId).push(quotationItemsById.get(item.id));
  });
  (warrantiesResult.data || []).forEach((warranty) => {
    const items = installationProductsById.get(warranty.installation_id) || [];
    const product = productsById.get(warranty.product_id) || productsByModel.get(warranty.equipment_model) || null;
    if (product && items.some((item) => item.product_id === product.id)) return;
    items.push({
      ...warranty,
      product_id: warranty.product_id || product?.id || null,
      products: product,
      product_name: product?.name || warranty.equipment_model || warranty.equipment_type,
    });
    installationProductsById.set(warranty.installation_id, items);
  });
  return reviews.filter((review) => {
    const item = orderItemsById.get(review.order_item_id);
    return item?.product_id && !item.package_id;
  }).map((review) => ({
    ...review,
    order_items: orderItemsById.get(review.order_item_id) || null,
    quotation_items: quotationItemsById.get(review.quotation_item_id) || null,
    installation_products: installationProductsById.get(review.installation_id) || [],
    quotation_number: quoteNumbersById.get(
      quoteByInstallation.get(review.installation_id)?.id || quotationItemsById.get(review.quotation_item_id)?.quotation_id,
    ) || '',
    related_installation_number: review.installations?.installation_number
      || installationsByQuoteId.get(quotationItemsById.get(review.quotation_item_id)?.quotation_id)?.installation_number
      || '',
  }));
}

export async function createReview({ orderItemId, rating, comment }) {
  const user = await getUser();
  if (!orderItemId) throw new Error('กรุณาเลือกสินค้าที่ต้องการรีวิว');
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      order_item_id: orderItemId,
      customer_id: user.id,
      rating,
      comment: comment.trim(),
      is_published: true,
    })
    .select('*')
    .single();
  if (error?.code === '42501') {
    throw new Error(`${error.message} — กรุณารัน migration 20261127040000_reviews_publish_immediately.sql ใน Supabase`);
  }
  if (error) throw error;
  return data;
}

export async function uploadPaymentSlip({ orderId, amount, file }) {
  const user = await getUser();
  if (!file) throw new Error('กรุณาเลือกไฟล์สลิป');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WebP');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('ไฟล์สลิปต้องมีขนาดไม่เกิน 5 MB');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${user.id}/${orderId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('payment-slips')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      customer_id: user.id,
      amount,
      method: 'bank_transfer',
      status: 'submitted',
      slip_url: path,
      paid_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
