export interface ConsultVariable {
  name: string;
  type: 'string' | 'date' | 'number';
  value: string;
  originalValue?: string;
}

export interface ConsultData {
  data: {
    variables: {
      contactAdditionalCanton: ConsultVariable;
      meansCanton_1: ConsultVariable;
      contactAdditionalProvince: ConsultVariable;
      meansProvince_1: ConsultVariable;
      fullname: ConsultVariable;
      sexo: ConsultVariable;
      contactAdditionalAddress: ConsultVariable;
      meansAddress_1: ConsultVariable;
      birthdayAt: ConsultVariable;
      civilStatus: ConsultVariable;
      cargas: ConsultVariable;
      dependenceRuc: ConsultVariable;
      dependenceName: ConsultVariable;
      dependencePhone: ConsultVariable;
      dependenceStart: ConsultVariable;
      dependencePosition: ConsultVariable;
      dependenceRango1: ConsultVariable;
      dependenceRango2: ConsultVariable;
      dependenceCanton: ConsultVariable;
      dependenceAddress: ConsultVariable;
      dependenceProvince: ConsultVariable;
    };
  };
}
