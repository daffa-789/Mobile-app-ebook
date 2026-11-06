import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useApp } from '@context/AppContext';

export const RouterBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRouterNavigator, syncScreenFromPath } = useApp();

  useEffect(() => {
    setRouterNavigator(navigate);
  }, [navigate, setRouterNavigator]);

  useEffect(() => {
    syncScreenFromPath(location.pathname);
  }, [location.pathname, syncScreenFromPath]);

  return null;
};
