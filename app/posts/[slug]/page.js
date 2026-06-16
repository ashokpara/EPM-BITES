import Link from "next/link";
import { getAllPosts, getPostBySlug } from "../../../lib/posts";
import { marked } from "marked";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return {
    title: `${post.title} — The EPM Post`,
    description: post.excerpt,
  };
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const html = marked(post.content);

  return (
    <div className="container">
      <Link href="/" className="back-link">
        ← All posts
      </Link>

      <div className="post-header">
        <div className="post-meta">{formatDate(post.date)}</div>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
      </div>

      <article
        className="post-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
