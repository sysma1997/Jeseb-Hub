export const FormatNumber = (value: number): string => {
    const rounded = Math.round(value * 100) / 100;

    let str = rounded.toFixed(2);
    if (str.includes('.')) str = str.replace('.', ',');
    
    const parts = str.split(',');
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';
    
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
};