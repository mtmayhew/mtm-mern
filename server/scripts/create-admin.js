import 'dotenv/config';
import readline from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

if(!process.env.MONGODB_URI)throw new Error('Set MONGODB_URI before running.');
const rl=readline.createInterface({input,output});
try{
 const username=(await rl.question('Admin username: ')).trim().toLowerCase();
 const password=process.env.ADMIN_SETUP_PASSWORD || await rl.question('Admin password (input visible; run in a private terminal): ');
 if(!/^[a-z0-9._-]{3,60}$/.test(username)||password.length<16||password.length>256)throw new Error('Use a 3-60 character username and a password of 16-256 characters.');
 await mongoose.connect(process.env.MONGODB_URI);
 const admins=mongoose.connection.collection('admins');
 await admins.createIndex({username:1},{unique:true});
 const existing=await admins.findOne({username});
 if(existing)throw new Error('Admin already exists. Script will not reset its password.');
 await admins.insertOne({username,passwordHash:await bcrypt.hash(password,12),createdAt:new Date()});
 console.log('Admin created. You can now sign in at /admin.');
}finally{rl.close();await mongoose.disconnect();}
