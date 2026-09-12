import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, ArrowUpRight, Sparkles, RefreshCw } from 'lucide-react'
import { useApp } from '../lib/context'
import { supabase,reviewSelect } from '../lib/supabase'
import { errorMessage } from '../lib/utils'
import type { Review } from '../lib/types'
import { ReviewCard } from '../components/Social'
import { MobileHeader } from '../components/Shell'
import { Avatar, TastyStar, EmptyState, Loading, Button, Modal } from '../components/ui'
import { Guide } from '../components/Guide'

export function Feed(){
  const {profile,user,people,reviews,setReviews,following,loading,dataError,refresh,notify}=useApp();const [tab,setTab]=useState('discover');const [busy,setBusy]=useState(false),[hasMore,setHasMore]=useState(true);const [params,setParams]=useSearchParams()
  const list=tab==='friends'?reviews.filter(r=>following.includes(r.user_id)||r.user_id===user?.id):reviews
  async function more(){setBusy(true);const {data,error}=await supabase.from('reviews').select(reviewSelect).order('created_at',{ascending:false}).range(reviews.length,reviews.length+19);setBusy(false);if(error)notify(errorMessage(error),'error');else{setReviews(current=>[...current,...(data as unknown as Review[]).filter(r=>!current.some(x=>x.id===r.id))]);setHasMore(data.length===20)}}
  return <div className="feed-page"><MobileHeader/><div className="feed-heading"><div><span className="eyebrow">SEU FEED GASTRONÔMICO</span><h1>Bom gosto é<br/>melhor <em>compartilhado.</em></h1></div><TastyStar className="feed-heading-star"/></div><div className="feed-tabs" role="tablist" aria-label="Tipo de feed"><button role="tab" aria-selected={tab==='friends'} className={tab==='friends'?'active':''} onClick={()=>setTab('friends')}>Amigos</button><button role="tab" aria-selected={tab==='discover'} className={tab==='discover'?'active':''} onClick={()=>setTab('discover')}>Descobrir<Sparkles size={15}/></button><span>AVALIAÇÕES DE QUEM PROVOU</span></div>
    <div className="stories"><Link to="/create" className="story"><span className="my-story"><Avatar profile={profile} size={58}/><span><Plus size={14}/></span></span><small>Seu prato</small></Link>{people.filter(p=>p.id!==user?.id).slice(0,5).map(p=><Link className="story" key={p.id} to={`/people/${p.id}`}><span className="story-ring"><Avatar profile={p} size={54}/></span><small>{p.full_name.split(' ')[0]}</small></Link>)}<Link to="/discover?section=people" className="stories-more"><ArrowUpRight size={21}/><small>Descubra<br/>pessoas</small></Link></div>
    {loading?<Loading/>:dataError?<EmptyState title="Sua mesa já vai ficar pronta" text={dataError}><Button onClick={()=>void refresh()}><RefreshCw size={17}/>Tentar novamente</Button></EmptyState>:list.length?list.map(r=><ReviewCard key={r.id} review={r}/>):<EmptyState title={tab==='friends'?'Boa comida é melhor com amigos':'A primeira garfada é sua'} text={tab==='friends'?'Siga pessoas com o seu gosto para ver as avaliações delas por aqui.':'Compartilhe o primeiro prato com a comunidade.'} action={tab==='friends'?'Descobrir pessoas':'Avaliar um prato'} to={tab==='friends'?'/discover?section=people':'/create'}/>}
    {!loading&&reviews.length>=20&&hasMore&&<Button className="outline-button load-more" loading={busy} onClick={()=>void more()}>Mais descobertas</Button>}
    {!loading&&list.length>0&&<div className="feed-end"><TastyStar/><p>Já deu fome por aí?</p><Link to="/discover">Encontre sua próxima boa descoberta<ArrowUpRight size={16}/></Link></div>}
    {params.get('guide')==='true'&&<Modal title="Guia Tasty" className="guide-modal" onClose={()=>setParams({},{replace:true})}><Guide onDone={()=>setParams({},{replace:true})}/></Modal>}
  </div>
}
