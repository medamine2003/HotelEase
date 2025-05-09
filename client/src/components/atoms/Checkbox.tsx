import React from 'react';

interface CheckboxProps {
    checked: boolean;
    label?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, label, onChange, className = "" }) => {
    return (
        <label className={`flex items-center space-x-2 ${className}`}>
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={onChange} 
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            {label && <span className="text-gray-700">{label}</span>}
        </label>
    );
};

export default Checkbox;
