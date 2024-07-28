import React, { createContext, useState } from 'react';

export const FaceDataContext = createContext();

export const FaceDataProvider = ({ children }) => {
    const [faceData, setFaceData] = useState([]);

    return (
        <FaceDataContext.Provider value={{ faceData, setFaceData }}>
            {children}
        </FaceDataContext.Provider>
    );
};