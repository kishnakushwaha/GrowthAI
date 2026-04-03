import React, { createContext, useState, useEffect } from 'react';
import API from '../config';

export const ContentContext = createContext();

export const ContentProvider = ({ children }) => {
  const [content, setContent] = useState({
    location: 'Delhi',
    email: 'dummy@gmail.com',
    whatsappNumber: '918743933258',
    pricing: {
      starter: 8000,
      growth: 15000,
      pro: 25000
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/content`)
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load content, using defaults', err);
        setLoading(false);
      });
  }, []);

  return (
    <ContentContext.Provider value={{ content, loading }}>
      {!loading && children}
    </ContentContext.Provider>
  );
};
