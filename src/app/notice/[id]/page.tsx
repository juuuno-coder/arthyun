import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: post, error } = await supabase
    .from('migrated_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    console.error('Error loading post:', error);
    notFound();
  }

  // 워드프레스 본문 스타일 보정을 위한 간단한 처리
  // (실제로는 더 복잡한 파싱이 필요할 수 있습니다)
  const contentHtml = post.content.replace(/\r\n/g, '<br/>');

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-24 min-h-screen">
      <Link 
        href="/notice" 
        className="text-gray-400 hover:text-black mb-12 inline-flex items-center gap-2 transition-colors font-light text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeLinecap="square"/>
        </svg>
        목록으로 돌아가기
      </Link>
      
      <header className="mb-16 border-b border-gray-100 pb-8">
        <h1 className="text-3xl md:text-5xl font-serif font-light mb-6 leading-tight break-keep">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-gray-400 font-light text-sm">
          <span>
            {post.date ? new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
          </span>
          <span className="w-px h-3 bg-gray-300"></span>
          <span>
             {post.type === 'page' ? 'Page' : 'Post'}
          </span>
        </div>
      </header>

      <article className="prose prose-lg max-w-none font-light text-gray-800 break-words whitespace-pre-wrap">
        {/* 워드프레스 콘텐츠 렌더링 */}
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </article>
    </div>
  );
}
