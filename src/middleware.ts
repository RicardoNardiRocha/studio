import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

export function middleware(request: NextRequest) {
  // Verifique se a rota começa com /api/integration/
  if (request.nextUrl.pathname.startsWith('/api/integration/')) {
    
    // Se a chave secreta não estiver configurada no ambiente, negue o acesso
    if (!INTERNAL_API_SECRET) {
      console.error('INTERNAL_API_SECRET não está definida nas variáveis de ambiente.');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Configuration error: Missing API secret.' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authorization header is missing.' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== INTERNAL_API_SECRET) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid authentication token.' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

// Configura o middleware para rodar apenas nas rotas de integração
export const config = {
  matcher: '/api/integration/:path*',
};
