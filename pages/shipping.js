import CheckoutWizard from '@/components/CheckoutWizard';
import Layout from '@/components/Layout';
import { Store } from '@/utils/Store';
import Cookies from 'js-cookie';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function ShippingScreen() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user.isClient) {
      router.push('/placeorderClient');
    }
  }, [router, session?.user]);

  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
  } = useForm();

  const { state, dispatch } = useContext(Store);
  const { cart } = state;
  const { shippingAddress } = cart;

  useEffect(() => {
    setValue('fullName', shippingAddress.fullName);
    setValue('address', shippingAddress.address);
    setValue('nit', shippingAddress.nit);
    setValue('city', shippingAddress.city);
  }, [setValue, shippingAddress]);

  const submitHandler = ({ fullName, address, nit, city }) => {
    dispatch({
      type: 'SAVE_SHIPPING_ADDRESS',
      payload: { fullName, address, nit, city },
    });
    Cookies.set(
      'cart',
      JSON.stringify({
        ...cart,
        shippingAddress: {
          fullName,
          address,
          nit,
          city,
        },
      })
    );
    router.push('/payment');
  };
  return (
    <Layout title="Direccion Envío">
      <CheckoutWizard activeStep={1} />
      <form
        className="mx-auto max-w-screen-md"
        onSubmit={handleSubmit(submitHandler)}
      >
        <h1 className="mb-4 text-xl">Dirección Envío</h1>
        <div className="mb-4">
          <label htmlFor="fullName">Nombre o Razón Social</label>
          <input
            className="w-full"
            id="fullName"
            autoFocus
            {...register('fullName', {
              required: 'Ingrese nombre completo',
            })}
          />
          {errors.fullName && (
            <div className="text-red-500">{errors.fullName.message}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="address">Dirección</label>
          <input
            className="w-full"
            id="address"
            autoFocus
            {...register('address', {
              required: 'Ingrese la direccón',
              minLength: { value: 3, message: 'Ingrese dirección válida' },
            })}
          />
          {errors.address && (
            <div className="text-red-500">{errors.address.message}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="nit">Nit o CC</label>
          <input
            className="w-full"
            id="nit"
            autoFocus
            {...register('nit', {
              required: 'Ingrese Nit o Cédula',
              minLength: { value: 5, message: 'Ingrese número válido' },
            })}
          />
          {errors.nit && (
            <div className="text-red-500">{errors.nit.message}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="fullName">Ciudad</label>
          <input
            className="w-full"
            id="city"
            autoFocus
            {...register('city', {
              required: 'Ingrese la ciudad',
            })}
          />
          {errors.city && (
            <div className="text-red-500">{errors.city.message}</div>
          )}
        </div>
        <div className="mb-4 flex justify-between">
          <button className="primary-button">Siguiente</button>
        </div>
      </form>
    </Layout>
  );
}

ShippingScreen.auth = true;
