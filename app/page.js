import Link from "next/link";
import { getAllPosts } from "../lib/posts";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="container">
      <div className="hero">
        <h1>The EPM Post</h1>
        <p>
          Practical insights for Oracle EPM professionals — Planning, Essbase,
          EDM, FDMEE, Narrative Reporting, and everything in between.
        </p>
      </div>

      <div className="glow-bar" />

      <section className="posts-section">
        <h2>Latest Posts</h2>
        <div className="post-list">
          {posts.map((post) => (
            <Link key={post.slug} href={`/posts/${post.slug}`} className="post-card">
              <div className="post-card-meta">{formatDate(post.date)}</div>
              <div className="post-card-title">{post.title}</div>
              {post.excerpt && (
                <div className="post-card-excerpt">{post.excerpt}</div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
