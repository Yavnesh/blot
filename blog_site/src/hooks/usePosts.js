import { useState, useEffect } from 'react'

const API = 'http://localhost:8080/api/v1/posts'

/**
 * Parses embedded AI frontmatter block and returns clean data
 */
function cleanPostData(post) {
    if (!post || !post.content) return post

    const raw = Array.isArray(post.content) ? post.content[0] : post.content

    // Better regex for metadata markers
    const titleMatch = raw.match(/\*{0,3}\s*Title:\s*\*{0,3}\s*([^\n]+)/i)
    const metaMatch = raw.match(/\*{0,3}\s*Meta Description:\s*\*{0,3}\s*([^\n]+)/i)
    const slugMatch = raw.match(/\*{0,3}\s*URL Slug:\s*\*{0,3}\s*`?([^\s`\n]+)`?/i)

    let embeddedTitle = titleMatch ? titleMatch[1].trim() : null
    let embeddedMeta = metaMatch ? metaMatch[1].trim() : null
    let embeddedSlug = slugMatch ? slugMatch[1].trim() : null

    // Fallback: If no "Title:" marker, use the first H1 (# Title)
    if (!embeddedTitle) {
        const h1Match = raw.match(/^#{1}\s+([^\n]+)/m)
        if (h1Match) embeddedTitle = h1Match[1].trim()
    }

    // Clean the body: strip the preamble and headers that are used for the title
    let cleanBody = raw
        .replace(/\*{0,3}\s*Title:\s*\*{0,3}\s*[^\n]+\n?/gi, '')
        .replace(/\*{0,3}\s*Meta Description:\s*\*{0,3}\s*[^\n]+\n?/gi, '')
        .replace(/\*{0,3}\s*URL Slug:\s*\*{0,3}\s*[^\n]+\n?/gi, '')
        .replace(/^---+\s*\n?/gm, '')
        .replace(/^\*+\s*\n?/gm, '') // Strip lines of just stars
        .replace(/^#+\s*H\d:\s*/gim, '# ') // Normalize "H1: Topic" -> "# Topic"
        // Strip common AI preamble sentences
        .replace(/^(This refined version|This refined draft|This version|This article|This draft|This content|The following draft).{0,100}(voice|tone|audience|flow|narrative|SEO|keyword|expert|deep-dive|brand).{0,60}\.\n?/gim, '')
        .replace(/^\s+/, '')

    // Handle redundant titles at the top
    if (embeddedTitle) {
        const titleEscaped = embeddedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Strip H1, H2, or Bold title if it's the first thing in the content
        const redundantTitleRegex = new RegExp(`^(#+\\s*|\\*{1,3}\\s*)${titleEscaped}(\\s*\\*{1,3})?\\s*\\n?`, 'i')
        cleanBody = cleanBody.replace(redundantTitleRegex, '').trim()
    }

    // Final cleanup of common debris
    cleanBody = cleanBody.replace(/^(\*+\s*)+/, '').trim()

    return {
        ...post,
        title: (embeddedTitle || post.title || 'Untitled').replace(/^#+\s*/, ''),
        excerpt: embeddedMeta || post.meta_description || post.excerpt || cleanBody.substring(0, 200),
        meta_description: embeddedMeta || post.meta_description || '',
        slug: embeddedSlug || post.slug,
        content: cleanBody
    }
}

export function usePosts() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch(`${API}/public/published`)
            .then(r => { if (!r.ok) throw new Error('Failed to load articles'); return r.json() })
            .then(data => {
                const cleaned = Array.isArray(data) ? data.map(cleanPostData) : []
                setPosts(cleaned)
                setLoading(false)
            })
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
            .then(data => {
                setPost(cleanPostData(data))
                setLoading(false)
            })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [slug])

    return { post, loading, error }
}
