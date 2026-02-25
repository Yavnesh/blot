import { useState, useEffect } from 'react'

const API = 'http://localhost:8080/api/v1/posts'

export function usePosts() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch(`${API}/public/published`)
            .then(r => { if (!r.ok) throw new Error('Failed to load articles'); return r.json() })
            .then(data => { setPosts(data); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [])

    return { posts, loading, error }
}

export function usePost(slug) {
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!slug) return
        setLoading(true)
        fetch(`${API}/public/${slug}`)
            .then(r => { if (!r.ok) throw new Error('Post not found'); return r.json() })
            .then(data => { setPost(data); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [slug])

    return { post, loading, error }
}
