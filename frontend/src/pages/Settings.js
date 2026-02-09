import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Alert,
    Divider,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon, VpnKey as KeyIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const ChangePasswordForm = ({ role, title, onSubmit }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (password.length < 4) {
            setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
            return;
        }

        onSubmit(role, password);
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    return (
        <Card sx={{ height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <KeyIcon sx={{ color: role === 'owner' ? '#D4AF37' : '#000', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="600">
                        {title}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {message.text && (
                    <Alert severity={message.type} sx={{ mb: 3 }}>
                        {message.text}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        margin="normal"
                        required
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            bgcolor: role === 'owner' ? '#D4AF37' : '#000',
                            '&:hover': {
                                bgcolor: role === 'owner' ? '#b5952f' : '#333',
                            },
                            py: 1.5
                        }}
                    >
                        Update Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

const Settings = () => {
    const { changePassword } = useAuth();

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    Settings
                </Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <ChangePasswordForm
                        role="owner"
                        title="Change Owner Password"
                        onSubmit={changePassword}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <ChangePasswordForm
                        role="employee"
                        title="Change Employee Password"
                        onSubmit={changePassword}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Settings;
