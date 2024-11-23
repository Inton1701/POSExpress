export function formatDate(date){
    if (date === null || date === undefined) {
        return 'Not yet updated';
    }
    const toDate = new Date(date);
    if (isNaN(toDate.getTime())) {
        return 'Invalid Date';
    }
    return toDate.toLocaleString();
};