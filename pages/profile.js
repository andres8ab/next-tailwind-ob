import React, { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { getError } from '@/utils/error';
import axios from 'axios';
import Layout from '@/components/Layout';

export default function ProfileScreen() {
  const { data: session } = useSession();

  const {
    handleSubmit,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    setValue('name', session.user.name);
    setValue('username', session.user.username);
  }, [session.user, setValue]);

  const submitHandler = async ({ name, username, password }) => {
    try {
      await axios.put('/api/auth/update', {
        name,
        username,
        password,
      });
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });
      toast.success('Perfil actualizado correctamente');
      if (result.error) {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(getError(err));
    }
  };
  return (
    <Layout title="perfil">
      <form
        className="mx-auto max-w-screen-md"
        onSubmit={handleSubmit(submitHandler)}
      >
        <h1 className="mb-4 text-xl">Actualizar Perfil</h1>
        <div className="mb-4">
          <label htmlFor="name">Nombre</label>
          <input
            type="text"
            className="w-full"
            id="name"
            autoFocus
            {...register('name', {
              required: 'Ingrese nombre',
            })}
          />
          {errors.name && (
            <div className="text-red-500">{errors.name.message}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="username">Email</label>
          <input
            type="text"
            className="w-full"
            id="username"
            {...register('username', {
              required: 'Ingrese email',
              pattern: {
                value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-.]+$/i,
                message: 'Ingrese un email válido',
              },
            })}
          />
          {errors.username && (
            <div className="text-red-500">{errors.username.message}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            className="w-full"
            id="password"
            {...register('password', {
              minLength: {
                value: 6,
                message: 'Contraseña debe ser superior a 5 carateres',
              },
            })}
          />
          {errors.password && (
            <div className="text-red-500">{errors.password.message}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword">Confirmar Contraseña</label>
          <input
            type="password"
            className="w-full"
            id="ConfirmPassword"
            {...register('ConfirmPassword', {
              validate: (value) => value === getValues('password'),
              minLength: {
                value: 6,
                message: 'Debe ser superior a 5 carateres',
              },
            })}
          />
          {errors.confirmPassword &&
            errors.confirmPassword.type === 'validate' && (
              <div className="text-red-500">Contraseña no coincide</div>
            )}
        </div>
        <div className="mb-4">
          <button className="primary-button">Guardar Cambios</button>
        </div>
      </form>
    </Layout>
  );
}
ProfileScreen.auth = true;
