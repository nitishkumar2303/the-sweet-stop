import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const userSchema = new mongoose.Schema({
    name: String,
    email :{type : String , unique: true , required: true},
    password : {type: String , required: true},
    role : {type: String , default : 'user'}
});



userSchema.pre('save' , async function(){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password , 10);
    }


})

userSchema.methods.comparePassword = function(plain){
    return bcrypt.compare(plain , this.password);
};


const User = mongoose.model('User' , userSchema);

export default User;