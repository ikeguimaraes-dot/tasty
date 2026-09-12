import { Bell, Bookmark, ChevronRight, Compass, Gamepad2, HelpCircle, MapPin, Plus, Search, Utensils, UserRound, ArrowUpRight, LogIn } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../lib/context'
import { Avatar, Logo, TastyStar, IconButton, Modal } from './ui'
import { Guide } from './Guide'
import { FollowButton } from './Social'

const links=[{to:'/',label:'Meu feed',icon:Utensils},{to:'/discover',label:'Descobrir',icon:Search},{to:'/create',label:'Avaliar um prato',icon:Plus},{to:'/games',label:'Tasty Games',icon:Gamepad2},{to:'/profile',label:'Meu perfil',icon:UserRound}]
export function Shell(){
  const {profile,user,people,dishes,restaurants}=useApp();const loc=useLocation();const navigate=useNavigate();const [guide,setGuide]=useState(false)
  const immersive=loc.pathname.startsWith('/games') || (loc.pathname==='/discover' && new URLSearchParams(loc.search).get('view')==='map')
  const best=[...dishes].sort((a,b)=>b.rating-a.rating).slice(0,3)
  return <div className={`app-shell ${immersive?'immersive-shell':''}`}>
    <aside className="desktop-sidebar">
      <Link className="sidebar-logo" to="/" aria-label="Tasty início"><Logo/><TastyStar/></Link>
      <span className="sidebar-tagline">Gente boa. Comida melhor.</span>
      <nav aria-label="Navegação principal" className="desktop-nav">{links.filter(l=>l.to!=='/create').map(({to,label,icon:Icon})=><NavLink end={to==='/'} key={to} to={to} className={({isActive})=>isActive?'active':''}><Icon size={23}/><span>{label}</span>{to==='/'&&<span className="nav-active-dot"/>}</NavLink>)}<NavLink to="/saved"><Bookmark size={23}/><span>Quero provar</span></NavLink><NavLink to="/notifications"><Bell size={23}/><span>Notificações</span></NavLink></nav>
      <Link to="/create" className="btn sidebar-review"><TastyStar/>Avaliar um prato</Link>
      <div className="sidebar-bottom"><button className="sidebar-help" onClick={()=>setGuide(true)}><HelpCircle size={20}/>Como funciona</button><div className="sidebar-divider"/>{user?<Link to="/profile" className="sidebar-account"><Avatar profile={profile}/><span><strong>{profile?.full_name || 'Seu perfil'}</strong><small>@{profile?.username}</small></span><ChevronRight size={18}/></Link>:<Link to="/welcome" className="sidebar-account"><span className="guest-avatar"><UserRound/></span><span><strong>Sua mesa está pronta</strong><small>Entrar ou criar conta</small></span><LogIn size={18}/></Link>}<p className="sidebar-copyright">© {new Date().getFullYear()} Tasty · Feito para descobrir</p></div>
    </aside>
    <div className="app-workspace"><header className="desktop-topbar"><span><MapPin size={17}/><strong>São Paulo, SP</strong><span className="topbar-city-note">Um prato de cada vez.</span></span><div><Link to="/discover" className="topbar-search"><Search size={17}/>O que vamos comer hoje?</Link><IconButton label="Ver notificações" onClick={()=>navigate('/notifications')}><Bell size={22}/></IconButton><Link to="/profile" aria-label="Seu perfil"><Avatar profile={profile} size={34}/></Link></div></header>
      <div className="workspace-columns"><main className="main-content" id="main-content"><Outlet/></main>
        {!immersive&&<aside className="right-rail"><div className="rail-intro"><span className="eyebrow">TEM COISA BOA POR AQUI</span><h2>Seu próximo<br/>“nossa, que delícia”.</h2><p>Descubra o que vale cada garfada.</p></div><Link to="/discover" className="weekly-rail"><img src="https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=85" alt="Massa fresca com pesto e tomates"/><span className="weekly-top"><span>SELEÇÃO TASTY</span><ArrowUpRight size={22}/></span><div className="weekly-bottom"><span>Pequenas descobertas,</span><h3>grandes sabores.</h3><span className="round-link">Encontre seu próximo favorito<ChevronRight size={17}/></span></div></Link>
          <section className="rail-section"><div className="section-title"><h3>Na sua lista de desejos</h3><TastyStar/></div>{best.map((d,i)=><Link to={`/dish/${d.id}`} key={d.id} className="mini-dish"><span className="rank-number">0{i+1}</span><img src={d.image_url} alt={d.name}/><span><strong>{d.name}</strong><small>{restaurants.find(r=>r.id===d.restaurant_id)?.name}</small></span><span className="mini-rating">★ {d.rating.toFixed(1)}</span></Link>)}</section>
          <section className="rail-section"><div className="section-title"><h3>Gente com bom gosto</h3><Link to="/discover?section=people">Ver todos</Link></div>{people.filter(p=>p.id!==user?.id).slice(0,3).map(p=><div className="person-row" key={p.id}><Link to={`/people/${p.id}`}><Avatar profile={p} size={42}/></Link><Link to={`/people/${p.id}`} className="person-name"><strong>{p.full_name}</strong><small>@{p.username}</small></Link><FollowButton person={p} compact/></div>)}</section>
          <div className="rail-note"><TastyStar/><p>A melhor recomendação<br/>vem de quem já provou.</p></div><p className="demo-notice">Catálogo inicial e perfis marcados como exemplo são demonstrativos. Fotos ilustrativas.</p>
        </aside>}
      </div>
    </div>
    <nav className="mobile-nav" aria-label="Navegação no celular">{links.map(({to,label,icon:Icon})=><NavLink end={to==='/'} key={to} to={to} aria-label={label} className={({isActive})=>`${isActive?'active':''} ${to==='/create'?'create-tab':''}`}>{to==='/create'?<TastyStar/>:<Icon/>}</NavLink>)}</nav>
    {guide&&<Modal title="Guia Tasty" onClose={()=>setGuide(false)} className="guide-modal"><Guide onDone={()=>setGuide(false)}/></Modal>}
  </div>
}
export function MobileHeader({info=false,onInfo}:{info?:boolean;onInfo?:()=>void}){return <header className="mobile-header"><Link to="/notifications" aria-label="Notificações"><Bell/></Link><Link to="/" aria-label="Tasty início"><Logo/></Link>{info?<IconButton label="Como funciona" onClick={onInfo}><HelpCircle/></IconButton>:<Link to="/saved" aria-label="Pratos salvos"><Bookmark/></Link>}</header>}
