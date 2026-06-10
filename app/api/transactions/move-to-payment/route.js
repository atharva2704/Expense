import { POST as bulkPost } from '../bulk/route';

export async function POST(request) {
  return bulkPost(request);
}
