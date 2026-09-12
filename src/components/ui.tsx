import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { X, ArrowRight, Utensils, LoaderCircle, Check, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/context'
import type { Profile } from '../lib/types'

export function Logo({className=''}:{className?:string}) { return <span className={`wordmark ${className}`} aria-label="Tasty">TASTY<span className="logo-dot">.</span></span> }
export function TastyStar({className='',value,outline=false}:{className?:string;value?:number|string;outline?:boolean}) {
  return <span className={`tasty-star ${className} ${outline?'star-outline':''}`} aria-label={value!==undefined?`Nota ${value}`:undefined} aria-hidden={value===undefined}>
    <svg viewBox="0 0 100 100" fill="currentColor"><path d="M43 13C46 3 57 3 60 13L65 29 82 30C94 30 98 41 89 49L75 60 79 77C82 88 72 95 63 89L49 79 35 89C25 95 16 88 19 77L23 60 9 49C0 42 4 30 16 30L33 29Z"/></svg>
    {value!==undefined && <b>{value}</b>}
  </span>
}
export function Avatar({profile,size=42}:{profile?:Partial<Profile>|null;size?:number}) {return profile?.avatar_url ? <img className="avatar" src={profile.avatar_url} alt={profile.full_name || profile.username || 'Perfil'} width={size} height={size} referrerPolicy="no-referrer"/> : <span className="avatar avatar-initial" style={{width:size,height:size,fontSize:size*.37}}>{(profile?.full_name || profile?.username || 'T').slice(0,1).toUpperCase()}</span>}
export function Button({children,className='',loading=false,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{loading?:boolean}) {return <button className={`btn ${className}`} {...props} disabled={props.disabled||loading}>{loading?<LoaderCircle size={19} className="spin"/>:null}{children}</button>}
export function IconButton({children,label,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{label:string}) {return <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...props}>{children}</button>}
export function Modal({title,children,onClose,className=''}:{title:string;children:ReactNode;onClose:()=>void;className?:string}) {
  const ref=useRef<HTMLDivElement>(null)
  const close=useRef(onClose);close.current=onClose
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden'
    ref.current?.focus()
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape')close.current()
      if(e.key==='Tab'){
        const nodes=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]') || [])
        const first=nodes[0],last=nodes[nodes.length-1]
        if(e.shiftKey && (document.activeElement===first || document.activeElement===ref.current)){e.preventDefault();last?.focus()}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus()}
      }
    }
    document.addEventListener('keydown',key)
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus()}
  },[])
  return <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className={`modal-panel ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}><div className="sheet-handle"/><div className="modal-heading"><h2>{title}</h2><IconButton label="Fechar" onClick={onClose}><X/></IconButton></div>{children}</div></div>
}
export function RatingInput({value,onChange,label='Sua nota'}:{value:number;onChange:(n:number)=>void;label?:string}) {return <fieldset className="rating-input"><legend>{label}<strong>{value.toFixed(1).replace('.',',')}</strong></legend><div className="star-buttons">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`${n} estrelas em ${label}`} aria-pressed={value>=n} onClick={()=>onChange(n)}><TastyStar className={value>=n?'filled':'empty'}/></button>)}</div><label className="rating-slider-label"><span>Ajuste a nota</span><input type="range" aria-label={`Ajustar ${label}`} min="0.5" max="5" step="0.5" value={value} onChange={e=>onChange(Number(e.target.value))}/></label></fieldset>}
export function EmptyState({title,text,action,to,children}:{title:string;text:string;action?:string;to?:string;children?:ReactNode}) {return <div className="empty-state"><div className="empty-icon"><Utensils/></div><h2>{title}</h2><p>{text}</p>{action&&to&&<Link className="btn" to={to}>{action}<ArrowRight size={18}/></Link>}{children}</div>}
export function Loading(){return <div className="loading-state" role="status"><TastyStar className="pulse"/><p>Preparando sua mesa…</p></div>}
export function ToastView(){const {toast}=useApp();return toast?<div className={`toast ${toast.tone}`} role={toast.tone==='error'?'alert':'status'}>{toast.tone==='error'?<AlertCircle size={20}/>:<Check size={20}/>}<span>{toast.text}</span></div>:null}
export function PageHeading({eyebrow,title,text,children}:{eyebrow?:string;title:string;text?:string;children?:ReactNode}){return <div className="page-heading"><div>{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{text&&<p>{text}</p>}</div>{children}</div>}
