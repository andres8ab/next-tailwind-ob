import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    isClient: { type: Boolean, required: true, default: false },
    clientDiscount: { type: Number, required: true, default: 0 },
    shippingAddress: {
      fullName: { type: String, required: false, default: '' },
      address: { type: String, required: false, default: '' },
      nit: { type: String, required: false, default: '' },
      city: { type: String, required: false, default: '' },
    },
    paymentMethod: { type: String, required: false, default: '' },
    seller: { type: String, required: true, default: 'Andres Ochoa' },
  },
  {
    timestamps: true,
  }
)

const User = mongoose.models.User || mongoose.model('User', userSchema)
export default User
