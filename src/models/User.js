import mongoose from 'mongoose';

const environmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  softwareType: {
    type: String,
    enum: ['erp', 'sgbd'],
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  }
});

const userSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  squad: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    validate: {
      validator: function(v) {
        return v.trim().length > 0; // Garante que o campo não seja vazio após trim
      },
      message: 'O campo squad não pode ser vazio',
    },
  },
  active: {
    type: Boolean,
    default: true,
  },
  activeEnvironments: {
    type: Number,
    default: 0,
  },
  environments: {
    type: [environmentSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length === 0 || v.every(env => env.id); // Garante que todos os environments tenham um ID, mas permite o array vazio
      },
      message: 'Todos os environments devem ter um ID',
    },
  },
  lastSession: {
    type: Date,
  },
});

// Atualiza activeEnvironments quando environments são atualizados
userSchema.pre('save', function(next) {
  this.activeEnvironments = this.environments.filter(env => env.active).length;
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
