import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export default function NotificationInbox({ user, navigate }) {
  const [items,setItems]=useState([]);
  const [open,setOpen]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    if(!user?.id||!supabase){setItems([]);return undefined;}
    const load=()=>supabase.from('notifications').select('id,title,body,link,created_at,read_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20)
      .then(({data,error:queryError})=>{if(!active)return;if(queryError)setError(queryError.message);else{setError('');setItems(data||[]);}});
    load();const timer=window.setInterval(load,30000);
    return()=>{active=false;window.clearInterval(timer);};
  },[user?.id]);
  async function markRead(item){
    if(!item.read_at){const now=new Date().toISOString();const {error:updateError}=await supabase.from('notifications').update({read_at:now}).eq('id',item.id);if(updateError){setError(updateError.message);return;}setItems((current)=>current.map((n)=>n.id===item.id?{...n,read_at:now}:n));}
    if(item.link?.startsWith('#/'))navigate(item.link.slice(1));setOpen(false);
  }
  if(!user||!supabase)return null;
  return <div className="notification-inbox">
    <button className="notification-toggle" type="button" aria-label="การแจ้งเตือน" aria-expanded={open} onClick={()=>setOpen((value)=>!value)}><Bell size={17}/>{items.some((item)=>!item.read_at)&&<i/>}</button>
    {open&&<section className="notification-popover"><header><strong>การแจ้งเตือน</strong><button type="button" onClick={()=>setOpen(false)}>ปิด</button></header>{error&&<p className="bk-error">โหลดการแจ้งเตือนไม่สำเร็จ: {error}</p>}{!error&&!items.length&&<p>ยังไม่มีการแจ้งเตือน</p>}{items.map((item)=><button type="button" key={item.id} className={`notification-item ${item.read_at?'read':''}`} onClick={()=>markRead(item)}><span>{!item.read_at&&<Check size={13}/>}<strong>{item.title}</strong></span><small>{item.body}</small><time>{new Date(item.created_at).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'})}</time></button>)}</section>}
  </div>;
}
