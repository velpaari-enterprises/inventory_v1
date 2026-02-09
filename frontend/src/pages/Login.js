import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Alert,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [role, setRole] = useState('employee');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        const success = login(role, password);

        if (success) {
            navigate('/');
        } else {
            setError('Invalid password for selected role');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                backgroundImage: 'linear-gradient(45deg, #f5f5f5 25%, #e0e0e0 25%, #e0e0e0 50%, #f5f5f5 50%, #f5f5f5 75%, #e0e0e0 75%, #e0e0e0 100%)',
                backgroundSize: '20px 20px',
            }}
        >
            <Card sx={{ maxWidth: 400, width: '100%', m: 2, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                backgroundColor: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <LockIcon sx={{ color: '#D4AF37', fontSize: 30 }} />
                        </Box>
                        <Typography variant="h5" component="h1" fontWeight="600" color="#333">
                            Inventory Login
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Select your role to continue
                        </Typography>
                    </Box>

                    <form onSubmit={handleLogin}>
                        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                            <RadioGroup
                                row
                                aria-label="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                sx={{ justifyContent: 'center' }}
                            >
                                <FormControlLabel
                                    value="employee"
                                    control={<Radio sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }} />}
                                    label="Employee"
                                />
                                <FormControlLabel
                                    value="owner"
                                    control={<Radio sx={{ color: '#D4AF37', '&.Mui-checked': { color: '#D4AF37' } }} />}
                                    label="Owner"
                                />
                            </RadioGroup>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused fieldset': {
                                        borderColor: role === 'owner' ? '#D4AF37' : '#000',
                                    },
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: role === 'owner' ? '#D4AF37' : '#000',
                                }
                            }}
                        />

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{
                                mt: 1,
                                bgcolor: role === 'owner' ? '#D4AF37' : '#000',
                                '&:hover': {
                                    bgcolor: role === 'owner' ? '#b5952f' : '#333',
                                }
                            }}
                        >
                            Login as {role === 'owner' ? 'Owner' : 'Employee'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login;
