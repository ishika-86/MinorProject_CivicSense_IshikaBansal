import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, ArrowDown, MessageSquare, Bookmark, PlusCircle, Image, Loader2, Flame, Clock, TrendingUp, X, Tag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import { EmptyState, Button, SearchInput, Modal } from '../../components/ui/index.jsx'

const AREAS = ['Lashkar','Gwalior Fort','Morar','Thatipur','City Center','Phool Bagh','DD Nagar','Govindpuri','Sirol','Hazira','Jhansi Road','Kampoo','Maharaj Bada','Tansen Nagar','Other']
const CATS  = ['General','Infrastructure','Water','Health','Safety','Environment','Animals','Other']
const TAGS_POOL = ['urgent','pothole','water-crisis','stray-dog','garbage','streetlight','encroachment','noise','flooding']

export default function Community() {
  const { user }       = useAuthStore()
  const [posts,        setPosts]          = useState([])
  const [loading,      setLoading]        = useState(true)
  const [sort,         setSort]           = useState('new')
  const [areaF,        setAreaF]          = useState('')
  const [search,       setSearch]         = useState('')
  const [catF,         setCatF]           = useState('')
  const [expanded,     setExpanded]       = useState(null)
  const [comments,     setComments]       = useState({})
  const [newComment,   setNewComment]     = useState({})
  const [postingCmt,   setPostingCmt]     = useState(null)
  const [showCreate,   setShowCreate]     = useState(false)
  const [convertPost,  setConvertPost]    = useState(null)
  const [form,         setForm]           = useState({ title:'', content:'', category:'General', area:'', customArea:'', tags:[] })
  const [formImgs,     setFormImgs]       = useState([])
  const [imgPreviews,  setImgPreviews]    = useState([])
  const [creating,     setCreating]       = useState(false)
  const [showCustomArea, setShowCustomArea] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ sort, limit:20 })
      if (areaF && areaF !== 'All') p.append('area', areaF)
      if (catF && catF !== 'All')   p.append('category', catF)
      if (search) p.append('search', search)
      const { data } = await api.get(`/community?${p}`)
      setPosts(data.posts || [])
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [sort, areaF, catF, search])

  const loadComments = async (id) => {
    try { const { data } = await api.get(`/community/${id}/comments`); setComments(c=>({...c,[id]:data.comments||[]})) } catch {}
  }

  const toggleExpand = (id) => {
    if (expanded===id) { setExpanded(null); return }
    setExpanded(id); loadComments(id)
  }

  const vote = async (id, type) => {
    try {
      const { data } = await api.post(`/community/${id}/vote`, { type })
      setPosts(ps=>ps.map(p=>p._id===id?{...p,upvoteCount:data.upvoteCount,downvoteCount:data.downvoteCount}:p))
    } catch { toast.error('Login to vote') }
  }

  const postComment = async (postId) => {
    const txt = (newComment[postId]||'').trim(); if (!txt) return
    setPostingCmt(postId)
    try {
      const { data } = await api.post(`/community/${postId}/comment`, { content:txt })
      setComments(c=>({...c,[postId]:[data.comment,...(c[postId]||[])]}))
      setNewComment(n=>({...n,[postId]:''}))
      setPosts(ps=>ps.map(p=>p._id===postId?{...p,commentCount:(p.commentCount||0)+1}:p))
    } catch { toast.error('Login to comment') } finally { setPostingCmt(null) }
  }

  const addImages = (files) => {
    const f = Array.from(files).slice(0, 3-formImgs.length)
    setFormImgs(a=>[...a,...f].slice(0,3))
    setImgPreviews(a=>[...a,...f.map(x=>URL.createObjectURL(x))].slice(0,3))
  }
  const removeFormImg = (i) => { setFormImgs(a=>a.filter((_,idx)=>idx!==i)); setImgPreviews(a=>a.filter((_,idx)=>idx!==i)) }

  const toggleTag = (tag) => setForm(f=>({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t=>t!==tag) : [...f.tags, tag].slice(0,4) }))

  const createPost = async () => {
    if (!form.title.trim()||!form.content.trim()) return toast.error('Fill title and content')
    setCreating(true)
    try {
      const fd = new FormData()
      const area = form.area==='Other' ? (form.customArea||'Other') : form.area
      fd.append('title', form.title); fd.append('content', form.content)
      fd.append('category', form.category); fd.append('area', area)
      fd.append('tags', JSON.stringify(form.tags))
      formImgs.forEach(f=>fd.append('images',f))
      const { data } = await api.post('/community', fd, { headers:{'Content-Type':'multipart/form-data'} })
      setPosts(ps=>[data.post,...ps])
      setShowCreate(false)
      setForm({ title:'', content:'', category:'General', area:'', customArea:'', tags:[] })
      setFormImgs([]); setImgPreviews([])
      toast.success('Post published!')
    } catch (e) { toast.error(e.response?.data?.message||'Failed') } finally { setCreating(false) }
  }

  const convert = async (post) => {
    try {
      const { data } = await api.post(`/community/${post._id}/convert`, { category:'Other', area:post.area||'Gwalior City' })
      toast.success(`Complaint ${data.complaint.complaintNumber} created!`)
      setConvertPost(null)
    } catch (e) { toast.error(e.response?.data?.message||'Failed') }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display text-dash-1 text-2xl font-bold">Community</h1><p className="text-dash-2 text-sm">Gwalior's civic discussion board</p></div>
        {user && <Button onClick={()=>setShowCreate(true)}><PlusCircle size={15}/> New Post</Button>}
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          {[{id:'new',icon:<Clock size={12}/>,label:'New'},{id:'hot',icon:<Flame size={12}/>,label:'Hot'},{id:'top',icon:<TrendingUp size={12}/>,label:'Top'}].map(({id,icon,label})=>(
            <button key={id} onClick={()=>setSort(id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${sort===id?'bg-dash-1 text-white':'bg-dash-4 text-dash-2 hover:bg-dash-3/40'}`}>{icon}{label}</button>
          ))}
          <div className="flex-1 min-w-36"><SearchInput value={search} onChange={setSearch} placeholder="Search posts…"/></div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All',...CATS].map(c=>(
            <button key={c} onClick={()=>setCatF(c==='All'?'':c)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${(!catF&&c==='All')||(catF===c)?'bg-auth-4 text-white':'bg-dash-4 text-dash-2 hover:bg-dash-3/30'}`}>{c}</button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All',...AREAS.slice(0,8)].map(a=>(
            <button key={a} onClick={()=>setAreaF(a==='All'?'':a)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${(!areaF&&a==='All')||(areaF===a)?'bg-dash-1 text-white':'bg-dash-4 text-dash-2 hover:bg-dash-3/30'}`}>{a}</button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? Array(4).fill(0).map((_,i)=><div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-3/4"/><div className="skeleton h-3 w-full"/><div className="skeleton h-3 w-5/6"/></div>)
        : posts.length===0 ? <EmptyState icon="💬" title="No posts yet" description="Be first to post!" action={user&&<Button onClick={()=>setShowCreate(true)}>Create Post</Button>}/>
        : posts.map((post,i)=>(
        <motion.div key={post._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="card p-5">
          <div className="flex items-start gap-3">
            {/* Vote */}
            <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
              <motion.button whileTap={{scale:0.85}} onClick={()=>vote(post._id,'up')} className="p-1.5 rounded-lg hover:bg-green-50 hover:text-green-600 text-dash-3 transition-colors"><ArrowUp size={15}/></motion.button>
              <span className="text-dash-1 text-sm font-bold">{post.upvoteCount-post.downvoteCount}</span>
              <motion.button whileTap={{scale:0.85}} onClick={()=>vote(post._id,'down')} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-dash-3 transition-colors"><ArrowDown size={15}/></motion.button>
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-dash-4 text-dash-2 px-2 py-0.5 rounded-full font-medium">{post.category}</span>
                {post.area&&<span className="text-xs text-dash-2/55">📍{post.area}</span>}
                {post.isHot&&<span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">🔥 Hot</span>}
              </div>
              <h3 className="text-dash-1 font-bold text-base leading-snug">{post.title}</h3>
              <p className="text-dash-2 text-sm mt-1 line-clamp-2 leading-relaxed">{post.content}</p>
              {/* Tags */}
              {post.tags?.length>0 && <div className="flex gap-1.5 mt-2 flex-wrap">{post.tags.map(t=><span key={t} className="text-[10px] bg-auth-1/40 text-auth-4 px-2 py-0.5 rounded-full border border-auth-3/20">#{t}</span>)}</div>}
              {/* Images */}
              {post.images?.length>0 && <div className="flex gap-2 mt-3 flex-wrap">{post.images.slice(0,3).map((img,idx)=><img key={idx} src={img} alt="" className="w-24 h-16 object-cover rounded-lg border border-dash-3/20"/>)}</div>}
              <div className="flex items-center gap-3 mt-3 text-xs text-dash-2/55">
                <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-gradient-to-br from-auth-3 to-auth-4 flex items-center justify-center text-white text-[10px] font-bold">{post.author?.name?.charAt(0).toUpperCase()}</div><span>{post.author?.name}</span></div>
                <span>{formatDistanceToNow(new Date(post.createdAt),{addSuffix:true})}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button onClick={()=>toggleExpand(post._id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-dash-4 text-dash-2 text-xs font-medium transition-colors"><MessageSquare size={12}/>{post.commentCount||0} Comments</button>
                {user&&<button onClick={()=>setConvertPost(post)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-amber-600 text-xs font-medium transition-colors">📋 Convert</button>}
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-dash-4 text-dash-2 text-xs font-medium transition-colors"><Bookmark size={12}/> Save</button>
              </div>
              {/* Comments */}
              <AnimatePresence>
                {expanded===post._id && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="mt-4 pt-4 border-t border-dash-4/70 space-y-3">
                    {user&&<div className="flex gap-2"><input value={newComment[post._id]||''} onChange={e=>setNewComment(n=>({...n,[post._id]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&postComment(post._id)} placeholder="Write a comment…" className="input text-sm flex-1"/><button onClick={()=>postComment(post._id)} disabled={postingCmt===post._id} className="btn-primary px-3 py-2 text-xs">{postingCmt===post._id?<Loader2 size={12} className="animate-spin"/>:'Post'}</button></div>}
                    {(comments[post._id]||[]).length===0?<p className="text-dash-2/40 text-xs text-center py-4">No comments yet</p>
                      :(comments[post._id]||[]).map(cm=>(
                      <div key={cm._id} className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-dash-3 to-dash-2 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">{cm.author?.name?.charAt(0).toUpperCase()}</div>
                        <div><div className="flex items-center gap-2"><span className="text-dash-1 text-xs font-semibold">{cm.author?.name}</span><span className="text-dash-2/40 text-[10px]">{formatDistanceToNow(new Date(cm.createdAt),{addSuffix:true})}</span></div><p className="text-dash-2 text-sm mt-0.5">{cm.content}</p></div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Create Post Modal */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="Create Community Post" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-dash-1 text-xs font-semibold mb-1 block">Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="input text-sm">
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-dash-1 text-xs font-semibold mb-1 block">Area</label>
              <select value={form.area} onChange={e=>{setForm(f=>({...f,area:e.target.value}));setShowCustomArea(e.target.value==='Other')}} className="input text-sm">
                <option value="">Select area</option>
                {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <AnimatePresence>
            {showCustomArea && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                <input value={form.customArea} onChange={e=>setForm(f=>({...f,customArea:e.target.value}))} placeholder="Type your area name" className="input text-sm"/>
              </motion.div>
            )}
          </AnimatePresence>
          <div><label className="text-dash-1 text-xs font-semibold mb-1 block">Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="What's happening in your area?" className="input text-sm"/></div>
          <div><label className="text-dash-1 text-xs font-semibold mb-1 block">Content *</label><textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={4} placeholder="Describe in detail…" className="input text-sm resize-none"/></div>
          {/* Tags */}
          <div>
            <label className="text-dash-1 text-xs font-semibold mb-2 block flex items-center gap-1"><Tag size={12}/>Tags (up to 4)</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS_POOL.map(t=>(
                <button key={t} type="button" onClick={()=>toggleTag(t)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${form.tags.includes(t)?'bg-auth-4 text-white':'bg-dash-4 text-dash-2 hover:bg-dash-3/40'}`}>#{t}</button>
              ))}
            </div>
          </div>
          {/* Image Upload with Preview */}
          <div>
            <label className="text-dash-1 text-xs font-semibold mb-2 block">Images (max 3)</label>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2.5 border-2 border-dashed border-dash-3/30 rounded-xl hover:border-auth-3 transition-colors">
              <input type="file" accept="image/*" multiple onChange={e=>addImages(e.target.files)} className="hidden"/>
              <Image size={15} className="text-dash-2"/>
              <span className="text-dash-2 text-sm">Click to add images</span>
            </label>
            {imgPreviews.length>0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {imgPreviews.map((p,i)=>(
                  <div key={i} className="relative w-20 h-20">
                    <img src={p} alt="" className="w-full h-full object-cover rounded-xl border border-dash-3/20"/>
                    <button type="button" onClick={()=>removeFormImg(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={9}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3"><Button onClick={createPost} loading={creating}>Publish Post</Button><Button variant="ghost" onClick={()=>setShowCreate(false)}>Cancel</Button></div>
        </div>
      </Modal>

      {/* Convert to Complaint Modal */}
      <Modal isOpen={!!convertPost} onClose={()=>setConvertPost(null)} title="Convert Post to Complaint">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-amber-800 text-sm font-medium">This creates a formal complaint submitted to civic authorities.</p></div>
          <p className="text-dash-2 text-sm">Post: <span className="font-semibold text-dash-1">"{convertPost?.title}"</span></p>
          <div className="flex gap-3"><Button onClick={()=>convert(convertPost)} variant="danger">Convert & Submit</Button><Button variant="ghost" onClick={()=>setConvertPost(null)}>Cancel</Button></div>
        </div>
      </Modal>
    </div>
  )
}
