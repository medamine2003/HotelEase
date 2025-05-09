import React from 'react';

interface InputProps {
    label?: string;
    value: string;
    type: string;
    placeholder: string;
    className?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const Input: React.FC<InputProps> = ({
    label,
    type,
    value,
    placeholder,
    className = "",
    onChange,
    required = false
}) => {
    return (
        <div className="flex flex-col space-y-1">
            {label && (
                <label className="text-gray-700 font-medium">
                    {label}
                </label>
            )}
            <input 
                type={type} 
                value={value} 
                placeholder={placeholder} 
                onChange={onChange}
                required={required}
                className={`w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${className}`}
            />
        </div>
    );
};

export default Input;
