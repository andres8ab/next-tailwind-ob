import Link from 'next/link';
import React, { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { getError } from '@/utils/error';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

export default function LoginScreen() {
  const { data: session } = useSession();

  const router = useRouter();
  const { redirect } = router.query;

  useEffect(() => {
    if (session?.user) {
      router.push(redirect || '/');
    }
  }, [redirect, router, session?.user]);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();
  const submitHandler = async ({ username, password }) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });
      if (result.error) {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(getError(err));
    }
  };
  return (
    <Layout title="Iniciar Sesion">
      <form
        className="mx-auto max-w-screen-md"
        onSubmit={handleSubmit(submitHandler)}
      >
        <h1 className="mb-4 text-xl">Iniciar Sesión</h1>
        <div className="mb-4">
          <label htmlFor="username">Email o Usuario</label>
          <input
            type="text"
            {...register('username', {
              required: 'Porfavor ingrese email',
              minLength: {
                value: 6,
                message: 'usuario mayor a 5 caracteres',
              },
            })}
            className="w-full"
            id="username"
            autoFocus
          ></input>
          {errors.username && (
            <div className="text-red-500">{errors.username.message}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            {...register('password', {
              required: 'Ingrese contraseña',
              minLength: {
                value: 6,
                message: 'contraseña mayor a 5 caracteres',
              },
            })}
            className="w-full"
            id="password"
            autoFocus
          ></input>
          {errors.password && (
            <div className="text-red-500">{errors.password.message}</div>
          )}
        </div>
        <div className="mb-4">
          <button className="primary-button">Iniciar Sesión</button>
        </div>
        <div className="mb-4">
          No tienes cuenta? &nbsp;
          <Link href={`/register?redirect=${redirect || '/'}`}>
            Crear Cuenta
          </Link>
        </div>
      </form>
    </Layout>
  );
}
