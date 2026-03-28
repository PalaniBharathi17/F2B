import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../context/AuthContext';

const RequireRole = ({ role, children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Spin fullscreen />;
    }

    if (!user) {
        return <Navigate to={`/login?role=${role}`} replace state={{ from: location.pathname }} />;
    }

    if (user.user_type !== role) {
        return <Navigate to={`/${user.user_type}/dashboard`} replace />;
    }

    return children;
};

RequireRole.propTypes = {
    role: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

export default RequireRole;
