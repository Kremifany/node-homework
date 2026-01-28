function buildSelect(fieldsParam) {
  if (!fieldsParam) return undefined;

  const selectObj = {};

  fieldsParam.split(',').forEach((field) => {
    const trimmedField = field.trim(); 
    selectObj[trimmedField] = true;
    });
     
  return selectObj;
}

module.exports = buildSelect;