export const FormatNumber = (value: number): string => {
    let str = String(value).trim();
    if (str.includes('.')) str = str.replace('.', ',');
    
    const parts = str.split(',');
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';
    
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
};