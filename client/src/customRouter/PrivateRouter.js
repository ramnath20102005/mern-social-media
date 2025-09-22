import React from 'react'
import { Route, Redirect } from "react-router-dom";
import { useSelector } from 'react-redux';

const PrivateRouter = (props) => {
    const { auth } = useSelector(state => state);
    const isAuthed = !!auth.token || !!localStorage.getItem('firstLogin');
    return isAuthed ? <Route {...props} /> :  <Redirect to="/" />
}

export default PrivateRouter
