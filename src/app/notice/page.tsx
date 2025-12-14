import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';

// 1분마다 갱신 (ISR) - 성능과 최신성 균형
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Notice - Art Hyun',
  description: '아트현의 새로운 소식과 공지사항을 확인하세요.',
};

export default async function NoticePage() {
  // Supabase에서 게시글 목록 가져오기
  // type이 'post'이고 status가 'publish'인 것만, 날짜 내림차순으로
  const { data: posts, error } = await supabase
    .from('migrated_posts')
    .select('id, title, date, excerpt, slug')
    .eq('type', 'post')
    .eq('status', 'publish')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>공지사항을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-24 min-h-screen">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-light mb-6">Notice</h1>
        <p className="text-gray-500 font-light">아트현의 새로운 소식들을 전해드립니다.</p>
      </div>

      <div className="border-t border-black">
        {(!posts || posts.length === 0) ? (
          <div className="py-20 text-center text-gray-400 font-light">
            등록된 게시글이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <Link 
                key={post.id} 
                href={`/notice/${post.id}`} 
                className="group block py-8 hover:bg-gray-50 transition-colors px-2"
              >
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2">
                  <h2 className="text-xl font-light group-hover:underline decoration-1 underline-offset-4">
                    {post.title}
                  </h2>
                  <span className="text-sm text-gray-400 font-light shrink-0">
                    {post.date ? new Date(post.date).toLocaleDateString('ko-KR') : '-'}
                  </span>
                </div>
                {post.excerpt && (
                  <p className="text-gray-500 font-light text-sm line-clamp-2 md:w-2/3">
                    {post.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
