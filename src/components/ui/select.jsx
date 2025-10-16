import React from 'react';

const Select = ({ options, onChange, value, placeholder }) => {
    return (
        <select value={value} onChange={onChange} className="select-component">
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option, index) => (
                <option key={index} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default Select;