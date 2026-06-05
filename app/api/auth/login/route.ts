import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Body recibido:', body);
    
    const { usuario, password } = body;
    console.log('Usuario:', usuario);
    console.log('Password:', password ? '***' : 'undefined');

    if (!usuario || !password) {
      console.log('Falta usuario o password');
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario en la base de datos
    const results = await query(
      'SELECT * FROM usuarios WHERE usuario = ? AND activo = TRUE',
      [usuario]
    ) as any[];

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const user = results[0];

    // Verificación simple de contraseña (en producción usar bcrypt)
    // Por ahora, comparar directamente
    if (user.contraseña !== password) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Crear sesión
    const token = require('crypto').randomBytes(32).toString('hex');
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    await query(
      'INSERT INTO sesiones (usuario_id, token, fecha_expiracion) VALUES (?, ?, ?)',
      [user.id, token, expirationDate]
    );

    // Retornar datos del usuario (sin contraseña)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        email: user.email,
        nombre_completo: user.nombre_completo,
        rol: user.rol,
      },
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
