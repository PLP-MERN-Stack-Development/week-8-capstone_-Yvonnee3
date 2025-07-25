const mongoose = require ('mongoose');
const { isEmail } = require ('validator');
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema ({
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters']
    },
// In your userSchema
rank: {
  type: String,
  enum: ['Support Staff', 'Junior Officer', 'Officer', 'Senior Officer', 'Assistant Director', 'Director'],
  required: function() { return this.role === 'employee'; } // Only required for employees
},
department: {
  type: String,
  required: function() { return this.role === 'employee'; }, // Only required for employees
  enum: ['hr', 'legal', 'accounts', 'IT'],
    validate: {
        validator: function(v) {
        // Only validate if role is employee
        if (this.role !== 'employee') return true;
        return ['hr', 'legal', 'accounts', 'IT'].includes(v);
        },
        message: props => `${props.value} is not a valid department!`
    }
},
role: {
  type: String,
  enum: ['employer', 'employee'],
  required: true,
  default: "employee"
},
    firstName: {
        type: String,
        required: [true, 'please enter your first name'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'please enter your last Name']
    },
}, {
    timestamps:true
})

userSchema.post('save', function (doc, next){
    console.log('new user registed', doc)
    next();
});

userSchema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email });
    if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            return user;
        }throw Error('incorrect password')
    }throw Error('incorrect email')
}

const User = mongoose.model('User', userSchema);

module.exports = User;