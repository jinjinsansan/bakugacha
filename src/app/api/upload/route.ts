import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { uploadToR2 } from '@/lib/r2/upload';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
// 許可する MIME と、保存時に使う拡張子の対応（クライアント由来の拡張子は信頼しない）
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const ALLOWED_TYPES = Object.keys(EXT_BY_TYPE);
const ALLOWED_PREFIXES = ['thumbnails', 'banners'];

export async function POST(req: NextRequest) {
  // ── 管理者認証 ──
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  const email = user.email as string | undefined;
  const lineId = user.line_user_id as string | undefined;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  const adminLineIds = (process.env.ADMIN_LINE_IDS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  const isAdmin = (!!email && adminEmails.includes(email)) || (!!lineId && adminLineIds.includes(lineId));
  if (!isAdmin) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
  }

  // ── リクエスト解析 ──
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const prefix = String(formData.get('prefix') ?? 'thumbnails');

  if (!file) {
    return NextResponse.json({ error: 'ファイルが指定されていません' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: '対応形式: JPEG, PNG, WebP, GIF' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
  }
  if (!ALLOWED_PREFIXES.includes(prefix)) {
    return NextResponse.json({ error: '無効なprefixです' }, { status: 400 });
  }

  // ── アップロード ──
  // 拡張子は検証済み MIME から決定する（.php/.html 等の混入を防ぐ）
  const ext = EXT_BY_TYPE[file.type] ?? 'bin';
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToR2(buffer, key, file.type);

  return NextResponse.json({ url });
}
