import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IRiskProfile {
    age: string;
    conditions: string[];
    allergies: string[];
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    riskProfile: IRiskProfile | null;
    twoFactorEnabled: boolean;
    twoFactorMethod: 'email' | 'totp' | null;
    twoFactorSecret: string | null;    // encrypted TOTP secret
    emailOtp: string | null;
    emailOtpExpiry: Date | null;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const riskProfileSchema = new Schema<IRiskProfile>(
    {
        age: { type: String, required: true },
        conditions: [{ type: String }],
        allergies: [{ type: String }],
    },
    { _id: false }
);

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        riskProfile: {
            type: riskProfileSchema,
            default: null,
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorMethod: {
            type: String,
            enum: ['email', 'totp', null],
            default: null,
        },
        twoFactorSecret: {
            type: String,
            default: null,
            select: false,
        },
        emailOtp: {
            type: String,
            default: null,
            select: false,
        },
        emailOtpExpiry: {
            type: Date,
            default: null,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
