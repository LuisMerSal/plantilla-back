import axios from 'axios';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GenericConnectionService } from 'src/external-services/generic-connection/generic-connection.service';
import { CreateConsultDto } from './dto/create-consult.dto';
import { UpdateConsultDto } from './dto/update-consult.dto';
import { PaginationDto, PaginatedResponse } from './dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionService } from '../module/transaction/transaction.service';
import * as createCsvWriter from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

export interface DatabookVariable {
  name: string;
  type: string;
  value: string;
  originalValue?: string;
}

export interface DatabookResponse {
  variables: {
    contactAdditionalCanton: DatabookVariable;
    meansCanton_1: DatabookVariable;
    contactAdditionalProvince: DatabookVariable;
    meansProvince_1: DatabookVariable;
    fullname: DatabookVariable;
    sexo: DatabookVariable;
    contactAdditionalAddress: DatabookVariable;
    meansAddress_1: DatabookVariable;
    birthdayAt: DatabookVariable;
    civilStatus: DatabookVariable;
    cargas: DatabookVariable;
    dependenceRuc: DatabookVariable;
    dependenceName: DatabookVariable;
    dependencePhone: DatabookVariable;
    dependenceStart: DatabookVariable;
    dependencePosition: DatabookVariable;
    dependenceRango1: DatabookVariable;
    dependenceRango2: DatabookVariable;
    dependenceCanton: DatabookVariable;
    dependenceAddress: DatabookVariable;
    dependenceProvince: DatabookVariable;
    phone: DatabookVariable;
    email: DatabookVariable;
    contactEmail_1: DatabookVariable;
    contactEmail_2: DatabookVariable;
    contactMedio_1: DatabookVariable;
    contactMedio_2: DatabookVariable;
    contactMedio_3: DatabookVariable;
    contactMedio_4: DatabookVariable;
    //contacto trabajo
    empleador1nombre1: DatabookVariable;
    employerPhone_1: DatabookVariable;
  };
}

@Injectable()
export class ConsultService {
  constructor(
    private prisma: PrismaService,
    private genericConnectionService: GenericConnectionService,
    private transactionService: TransactionService,
  ) {}

  async create(createConsultDto: CreateConsultDto, userId: string) {
    const _url = process.env.URL_DATABOOK || '';
    const _apiKey = process.env.API_KEY_DATABOOK || '';
    const score = 700;

    console.log('=== CREATE CONSULT DEBUG ===');
    console.log('userId:', userId);
    console.log('createConsultDto:', createConsultDto);
    console.log('URL_DATABOOK:', _url);
    console.log('API_KEY_DATABOOK exists:', !!_apiKey);

    const existingConsultation = await this.prisma.databookConsult.findFirst({
      where: {
        identityNumber: createConsultDto.identityNumber,
        isActive: true,
      },
    });

    if (existingConsultation) {
      return {
        message: 'A consult with this identity number already exists',
      };
    }

    // Prepare the data with defaults and auto-generated values
    const consultData = {
      identityNumber: createConsultDto.identityNumber,
      registrationNumber:
        createConsultDto.registrationNumber ||
        `${createConsultDto.identityNumber}001`,
      isForced: createConsultDto.isForced ?? false,
      origin: createConsultDto.origin || 'SistemaInterno360',
      variables: [
        'contactAdditionalCanton',
        'meansCanton_1',
        'contactAdditionalProvince',
        'meansProvince_1',
        'fullname',
        'sexo',
        'contactAdditionalAddress',
        'meansAddress_1',
        'birthdayAt',
        'civilStatus',
        'cargas',
        'dependenceRuc',
        'dependenceName',
        'dependencePhone',
        'dependenceStart',
        'dependencePosition',
        'dependenceRango1',
        'dependenceRango2',
        'dependenceCanton',
        'dependenceAddress',
        'dependenceProvince',
        //medios de contacto
        'contactAdditionalCanton',
        'contactAdditionalPhone',
        'contactAdditionalAddress',
        'contactAdditionalParish',
        'contactAdditionalProvince',
        //
        'phone',
        'email',
        'contactEmail_1',
        'contactEmail_2',
        'contactMedio_1',
        'contactMedio_2',
        'contactMedio_3',
        'contactMedio_4',
        //contacto trabajo
        'empleador1nombre1',
        'employerPhone_1',
      ],
      isProduction:
        createConsultDto.isProduction ?? process.env.NODE_ENV === 'production',
    };

    console.log('consultData prepared:', consultData);

    const externalData = (await this.genericConnectionService.get(
      _url,
      _apiKey,
      consultData,
      '',
    )) as unknown as DatabookResponse;

    // Obtener factor basado en el score (debe estar entre min y max) y type
    const factor = await this.prisma.factor.findFirst({
      where: {
        scoreBuroMinimo: { lte: score }, // score >= minimum
        scoreBuroMaximo: { gte: score }, // score <= maximum
        type: 'con_score', // Especificar el tipo
      },
    });

    // Calcular cupo usando el factor promedio
    const dependenceRango2 =
      parseFloat(externalData?.variables?.dependenceRango2?.value) || 0;
    const factorPromedio = factor?.factorPromedio || 0.4; // Factor por defecto si no se encuentra
    let cupo = dependenceRango2 * factorPromedio;

    // Validar que el cupo no sea mayor a 333
    if (cupo > 333) {
      cupo = 333;
    }

    let shawdonQuota = dependenceRango2 * (factor?.factorSombra || 0.0);

    // Validar que el shawdonQuota no sea mayor a 333
    if (shawdonQuota > 333) {
      shawdonQuota = 333;
    }

    const cuota = cupo * 30 > 5000 ? 5000 : cupo * 30;

    console.log('=== CALCULO DE CUPO ===');
    console.log('Score:', score);
    console.log('Dependence Rango2:', dependenceRango2);
    console.log('Factor encontrado:', factor);
    console.log('Factor Promedio usado:', factorPromedio);
    console.log('Cupo calculado:', cupo);
    try {
      console.log('=== ATTEMPTING DATABASE SAVE ===');
      console.log('Data to save:', {
        identityNumber: consultData.identityNumber,
        fullname: externalData?.variables?.fullname?.value || 'NO-DATA',
        sexo: externalData?.variables?.sexo?.value || 'NO-DATA',
        edad: this.calculateAge(externalData?.variables?.birthdayAt?.value),
        civilStatus: externalData?.variables?.civilStatus?.value || 'NO-DATA',
        cargas: parseInt(externalData?.variables?.cargas?.value) || 0,
        dependenceName:
          externalData?.variables?.dependenceName?.value || 'NO-DATA',
        dependenceStart: this.parseDate(
          externalData?.variables?.dependenceStart?.value,
        ),
        dependencePosition:
          externalData?.variables?.dependencePosition?.value || 'NO-DATA',
        dependenceAddress:
          externalData?.variables?.dependenceAddress?.value || 'NO-DATA',
        dependenceRango1:
          parseFloat(externalData?.variables?.dependenceRango1?.value) || 0.0,
        dependenceRango2:
          parseFloat(externalData?.variables?.dependenceRango2?.value) || 0.0,
        cupo: cupo,
        telefono1: externalData?.variables?.contactMedio_1?.value || 'NO-DATA',
        telefono2:
          externalData?.variables?.contactMedio_2?.value ||
          externalData?.variables?.phone?.value ||
          'NO-DATA',
        telefono3: externalData?.variables?.contactMedio_3?.value || 'NO-DATA',
        correo1: externalData?.variables?.contactEmail_1?.value || 'NO-DATA',
        correo2:
          externalData?.variables?.contactEmail_2?.value ||
          externalData?.variables?.email?.value ||
          'NO-DATA',

        createdBy: userId || 'NO-DATA',
        isActive: true,
      });

      const externalDataByDni = await this.genericConnectionService.getByDni(
        consultData.identityNumber,
      );
      console.log(externalDataByDni);

      // Obtener datos del RUC
      const ruc = `${consultData.identityNumber}001`;
      const rucData = await this.genericConnectionService.getByRuc(ruc);
      console.log('RUC Data:', rucData);

      // Obtener datos penales
      const penalData = await this.genericConnectionService.getByPenal(
        consultData.identityNumber,
      );
      console.log('Penal Data:', penalData);

      // Obtener datos de vehículos
      const vehicleData = await this.genericConnectionService.getByTransitCar(
        consultData.identityNumber,
      );
      console.log('Vehicle Data:', vehicleData);

      // Parsear y validar dependenceStart antes de usarlo
      const dependenceStartValue =
        externalData?.variables?.dependenceStart?.value;
      console.log('dependenceStart raw value:', dependenceStartValue);
      const parsedDependenceStart = this.parseDate(dependenceStartValue);
      console.log('dependenceStart parsed:', parsedDependenceStart);

      const savedConsult = await this.prisma.databookConsult.create({
        data: {
          identityNumber: consultData.identityNumber,
          fullname: externalData?.variables?.fullname?.value || 'NO-DATA',
          sexo: externalData?.variables?.sexo?.value || 'NO-DATA',
          edad: this.calculateAge(externalData?.variables?.birthdayAt?.value),
          civilStatus: externalData?.variables?.civilStatus?.value || 'NO-DATA',
          cargas: parseInt(externalData?.variables?.cargas?.value) || 0,
          dependenceName:
            externalData?.variables?.dependenceName?.value || 'NO-DATA',
          dependenceStart: parsedDependenceStart,
          dependencePosition:
            externalData?.variables?.dependencePosition?.value || 'NO-DATA',
          dependenceAddress:
            externalData?.variables?.dependenceAddress?.value || 'NO-DATA',
          dependenceRango1:
            parseFloat(externalData?.variables?.dependenceRango1?.value) || 0.0,
          dependenceRango2:
            parseFloat(externalData?.variables?.dependenceRango2?.value) || 0.0,
          nacionalidad: externalDataByDni?.nacionalidad || 'NO-DATA',
          conyuge: externalDataByDni?.conyuge || 'NO-DATA',
          calleDomicilio: externalDataByDni?.calleDomicilio || 'NO-DATA',
          numeracionDomicilio:
            externalDataByDni?.numeracionDomicilio || 'NO-DATA',
          nombreMadre: externalDataByDni?.nombreMadre || 'NO-DATA',
          nombrePadre: externalDataByDni?.nombrePadre || 'NO-DATA',
          lugarNacimiento: externalDataByDni?.lugarNacimiento || 'NO-DATA',
          instruccion: externalDataByDni?.instruccion || 'NO-DATA',
          profesion: externalDataByDni?.profesion || 'NO-DATA',
          cupo: cupo,
          cuota: cuota,
          shawdonQuota: shawdonQuota,
          profileCredit: parseFloat('01'),

          telefono1:
            externalData?.variables?.contactMedio_1?.value || 'NO-DATA',
          telefono2:
            externalData?.variables?.contactMedio_2?.value ||
            externalData?.variables?.phone?.value ||
            'NO-DATA',
          telefono3:
            externalData?.variables?.contactMedio_3?.value || 'NO-DATA',
          correo1: externalData?.variables?.contactEmail_1?.value || 'NO-DATA',
          correo2:
            externalData?.variables?.contactEmail_2?.value ||
            externalData?.variables?.email?.value ||
            'NO-DATA',
          createdBy: userId || 'NO-DATA',
          isActive: true,
          rucData: {
            create: {
              numeroRuc: rucData.numeroRuc || ruc,
              razonSocial: rucData.razonSocial || 'NO-DATA',
              estadoContribuyenteRuc:
                rucData.estadoContribuyenteRuc || 'NO-DATA',
              actividadEconomicaPrincipal:
                rucData.actividadEconomicaPrincipal || 'NO-DATA',
              tipoContribuyente: rucData.tipoContribuyente || 'NO-DATA',
              regimen: rucData.regimen || 'NO-DATA',
              categoria: rucData.categoria,
              obligadoLlevarContabilidad:
                rucData.obligadoLlevarContabilidad || 'NO',
              agenteRetencion: rucData.agenteRetencion || 'NO',
              contribuyenteEspecial: rucData.contribuyenteEspecial || 'NO',
              fechaInicioActividades: rucData.informacionFechasContribuyente
                ?.fechaInicioActividades
                ? new Date(
                    rucData.informacionFechasContribuyente.fechaInicioActividades,
                  )
                : null,
              fechaCese: rucData.informacionFechasContribuyente?.fechaCese
                ? new Date(rucData.informacionFechasContribuyente.fechaCese)
                : null,
              fechaReinicioActividades: rucData.informacionFechasContribuyente
                ?.fechaReinicioActividades
                ? new Date(
                    rucData.informacionFechasContribuyente.fechaReinicioActividades,
                  )
                : null,
              fechaActualizacion: rucData.informacionFechasContribuyente
                ?.fechaActualizacion
                ? new Date(
                    rucData.informacionFechasContribuyente.fechaActualizacion,
                  )
                : null,
              motivoCancelacionSuspension: rucData.motivoCancelacionSuspension,
              contribuyenteFantasma: rucData.contribuyenteFantasma || 'NO',
              transaccionesInexistente:
                rucData.transaccionesInexistente || 'NO',
              clasificacionMiPyme: rucData.clasificacionMiPyme,
              establecimientos: rucData.establecimientos || [],
              representantesLegales: rucData.representantesLegales || [],
              error: rucData.error || null,
            },
          },
          penalData: {
            create: {
              identityNumber: consultData.identityNumber,
              denuncias: penalData.denuncias || [],
              total: penalData.total || 0,
              error: penalData.error || null,
            },
          },
          vehicleDatas: {
            create: {
              identityNumber: consultData.identityNumber,
              success: vehicleData.success ?? false,
              totalVehiculos: vehicleData.total_vehiculos ?? 0,
              vehiculosConsultados: vehicleData.vehiculos_consultados ?? 0,
              limiteConsultas: vehicleData.limite_consultas ?? 0,
              payload: vehicleData.payload ?? Prisma.JsonNull,
              error: vehicleData.error || null,
            },
          },
        },
      });

      console.log('=== DATABASE SAVE SUCCESSFUL ===');
      console.log('Saved consult ID:', savedConsult?.id);
      //guarda infomación de transito
      await this.consultTransitData(
        createConsultDto.identityNumber,
        savedConsult.id,
      );
      return {
        message: 'Consult created successfully',
        data: savedConsult,

        consultData: consultData,
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new InternalServerErrorException(
        'Failed to create consult in database',
      );
    }
  }

  async createMassive(createConsultDto: any, userId: string) {
    // Implementación del método para crear consultas masivas en segundo plano

    const transaction = await this.transactionService.createTransaction({
      type: 'Massive',
      status: 'pending',
      message: 'Processing massive consults...',
      datajson: {
        userId,
        totalRecords: Array.isArray(createConsultDto.identityNumber)
          ? createConsultDto.identityNumber.length
          : 1,
      },
    });

    // Ejecutar el proceso en segundo plano sin esperar
    this.createMassiveProcess(createConsultDto, userId, transaction).catch(
      (error) => {
        // Log de errores pero no afecta la respuesta al frontend
        console.error('Background process error:', error);

        // Actualizar transacción con error
        this.transactionService
          .updateTransactionStatus(
            transaction.id,
            'error',
            `Process failed: ${error.message}`,
            { error: error.message },
          )
          .catch((updateError) => {
            console.error(
              'Failed to update transaction on error:',
              updateError,
            );
          });
      },
    );

    // Respuesta inmediata al frontend
    return {
      message: 'Massive consult process started successfully',
      transactionId: transaction.id,
      status: 'pending',
      totalRecords: Array.isArray(createConsultDto.identityNumber)
        ? createConsultDto.identityNumber.length
        : 1,
      info: 'The process is running in the background. Check the transaction status for updates.',
    };
  }

  async createMassiveProcess(
    createConsultDto: any,
    userId: string,
    transaction: any,
  ) {
    const _url = process.env.URL_DATABOOK || '';
    const _apiKey = process.env.API_KEY_DATABOOK || '';

    console.log('=== CREATE MASSIVE CONSULT DEBUG ===');
    console.log('userId:', userId);
    console.log('createConsultDto:', createConsultDto);
    console.log('URL_DATABOOK:', _url);
    console.log('API_KEY_DATABOOK exists:', !!_apiKey);

    // Handle array of identity numbers
    const identityNumbers = Array.isArray(createConsultDto.identityNumber)
      ? createConsultDto.identityNumber
      : [createConsultDto.identityNumber];

    console.log('=== IDENTITY NUMBERS TO PROCESS ===');
    console.log('Total numbers:', identityNumbers.length);
    console.log('Numbers:', identityNumbers);

    // Check for existing consultations BEFORE processing any
    console.log('=== PRE-VALIDATION: CHECKING ALL DUPLICATES ===');
    const existingValidation = await this.prisma.databookConsult.findMany({
      where: {
        identityNumber: { in: identityNumbers },
        isActive: true,
      },
      select: {
        identityNumber: true,
        id: true,
        createdAt: true,
      },
    });

    console.log('Existing consultations found:', existingValidation.length);
    existingValidation.forEach((existing) => {
      console.log(
        `- ${existing.identityNumber} (ID: ${existing.id}, Created: ${existing.createdAt})`,
      );
    });

    // Filter out existing identity numbers
    const existingNumbers = existingValidation.map((ex) => ex.identityNumber);
    const numbersToProcess = identityNumbers.filter(
      (num) => !existingNumbers.includes(num),
    );

    console.log('=== FILTERING DUPLICATES ===');
    console.log('Original count:', identityNumbers.length);
    console.log('Existing count:', existingNumbers.length);
    console.log('To process count:', numbersToProcess.length);

    const results: any[] = [];
    const errors: any[] = [];

    // Add existing numbers to errors
    existingNumbers.forEach((existingNum) => {
      errors.push({
        identityNumber: existingNum,
        error: 'A consult with this identity number already exists',
      });
    });

    // Configuración para control de flujo
    const BATCH_SIZE = 5; // Procesar de 5 en 5
    const DELAY_BETWEEN_BATCHES = 2000; // 2 segundos entre lotes
    const DELAY_BETWEEN_TRANSACTIONS = 500; // 500ms entre transacciones individuales
    const MAX_RECORDS = 500; // Máximo 50 registros por operación

    // Validar límite máximo
    if (numbersToProcess.length > MAX_RECORDS) {
      return {
        message: `Error: Maximum ${MAX_RECORDS} records allowed per operation. You tried to process ${numbersToProcess.length} records.`,
        successCount: 0,
        errorCount: numbersToProcess.length,
        results: [],
        errors: numbersToProcess.map((num) => ({
          identityNumber: num,
          error: `Exceeded maximum batch size of ${MAX_RECORDS} records`,
        })),
      };
    }

    console.log(
      `=== PROCESSING ${numbersToProcess.length} RECORDS IN BATCHES OF ${BATCH_SIZE} ===`,
    );

    // Procesar en lotes
    for (let i = 0; i < numbersToProcess.length; i += BATCH_SIZE) {
      const batch = numbersToProcess.slice(i, i + BATCH_SIZE);
      console.log(
        `\n=== PROCESSING BATCH ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records) ===`,
      );

      for (const identityNumber of batch) {
        try {
          console.log(`=== PROCESSING IDENTITY NUMBER: ${identityNumber} ===`);

          // Check if consultation already exists (optional check)
          /*
        const existingConsultation = await this.prisma.databookConsult.findFirst({
          where: {
            identityNumber: identityNumber,
            isActive: true,
          },
        });
        if (existingConsultation) {
          errors.push({
            identityNumber,
            error: 'A consult with this identity number already exists'
          });
          continue;
        }
        */

          // Prepare the data with defaults and auto-generated values
          const consultData = {
            identityNumber: identityNumber,
            registrationNumber:
              createConsultDto.registrationNumber || `${identityNumber}001`,
            isForced: createConsultDto.isForced ?? false,
            origin: createConsultDto.origin || 'SistemaInterno360',
            variables: [
              'contactAdditionalCanton',
              'meansCanton_1',
              'contactAdditionalProvince',
              'meansProvince_1',
              'fullname',
              'sexo',
              'contactAdditionalAddress',
              'meansAddress_1',
              'birthdayAt',
              'civilStatus',
              'cargas',
              'dependenceRuc',
              'dependenceName',
              'dependencePhone',
              'dependenceStart',
              'dependencePosition',
              'dependenceRango1',
              'dependenceRango2',
              'dependenceCanton',
              'dependenceAddress',
              'dependenceProvince',
              'phone',
              'email',
              'contactEmail_1',
              'contactEmail_2',
              'contactMedio_1',
              'contactMedio_2',
              'contactMedio_3',
              'contactMedio_4',
              //contacto trabajo
              'empleador1nombre1',
              'employerPhone_1',
            ],
            isProduction:
              createConsultDto.isProduction ??
              process.env.NODE_ENV === 'production',
          };

          console.log('consultData prepared:', consultData);

          const externalData = (await this.genericConnectionService.get(
            _url,
            _apiKey,
            consultData,
            '',
          )) as unknown as DatabookResponse;

          console.log('=== ATTEMPTING DATABASE SAVE ===');

          const externalDataByDni =
            await this.genericConnectionService.getByDni(identityNumber);
          console.log('External data by DNI:', externalDataByDni);

          // Obtener datos del RUC
          const ruc = `${identityNumber}001`;
          const rucData = await this.genericConnectionService.getByRuc(ruc);
          console.log('RUC Data for', identityNumber, ':', rucData);

          // Obtener datos penales
          const penalData =
            await this.genericConnectionService.getByPenal(identityNumber);
          console.log('Penal Data for', identityNumber, ':', penalData);

          // Obtener factor basado en el score (debe estar entre min y max) y type
          const score = 700; // Score por defecto, puede ser configurable
          const factor = await this.prisma.factor.findFirst({
            where: {
              scoreBuroMinimo: { lte: score }, // score >= minimum
              scoreBuroMaximo: { gte: score }, // score <= maximum
              type: 'con_score', // Especificar el tipo
            },
          });

          // Calcular cupo usando el factor promedio
          const dependenceRango2 =
            parseFloat(externalData?.variables?.dependenceRango2?.value) || 0;
          const factorPromedio = factor?.factorPromedio || 0.4; // Factor por defecto si no se encuentra
          let cupo =
            (dependenceRango2 === 0 ? 470 : dependenceRango2) * factorPromedio;

          // Validar que el cupo no sea mayor a 333
          if (cupo > 333) {
            cupo = 333;
          }

          let shawdonQuota = dependenceRango2 * (factor?.factorSombra || 0.0);

          // Validar que el shawdonQuota no sea mayor a 333
          if (shawdonQuota > 333) {
            shawdonQuota = 333;
          }

          const cuota = cupo * 30 > 5000 ? 5000 : cupo * 30;

          // Parsear y validar dependenceStart antes de usarlo
          const dependenceStartValue =
            externalData?.variables?.dependenceStart?.value;
          console.log(
            'createMassive - dependenceStart raw value:',
            dependenceStartValue,
          );
          const parsedDependenceStart = this.parseDate(dependenceStartValue);
          console.log(
            'createMassive - dependenceStart parsed:',
            parsedDependenceStart,
          );

          const savedConsult = await this.prisma.databookConsult.create({
            data: {
              identityNumber: identityNumber,
              fullname: externalData?.variables?.fullname?.value || 'NO-DATA',
              sexo: externalData?.variables?.sexo?.value || 'NO-DATA',
              edad: this.calculateAge(
                externalData?.variables?.birthdayAt?.value,
              ),
              civilStatus:
                externalData?.variables?.civilStatus?.value || 'NO-DATA',
              cargas: parseInt(externalData?.variables?.cargas?.value) || 0,
              dependenceName:
                externalData?.variables?.dependenceName?.value || 'NO-DATA',
              dependenceStart: parsedDependenceStart,
              dependencePosition:
                externalData?.variables?.dependencePosition?.value || 'NO-DATA',
              dependenceAddress:
                externalData?.variables?.dependenceAddress?.value || 'NO-DATA',
              dependenceRango1:
                parseFloat(externalData?.variables?.dependenceRango1?.value) ||
                0.0,
              dependenceRango2:
                parseFloat(externalData?.variables?.dependenceRango2?.value) ||
                0.0,
              nacionalidad: externalDataByDni?.nacionalidad || 'NO-DATA',
              conyuge: externalDataByDni?.conyuge || 'NO-DATA',
              calleDomicilio: externalDataByDni?.calleDomicilio || 'NO-DATA',
              numeracionDomicilio:
                externalDataByDni?.numeracionDomicilio || 'NO-DATA',
              nombreMadre: externalDataByDni?.nombreMadre || 'NO-DATA',
              nombrePadre: externalDataByDni?.nombrePadre || 'NO-DATA',
              lugarNacimiento: externalDataByDni?.lugarNacimiento || 'NO-DATA',
              instruccion: externalDataByDni?.instruccion || 'NO-DATA',
              profesion: externalDataByDni?.profesion || 'NO-DATA',

              telefono1:
                externalData?.variables?.contactMedio_1?.value || 'NO-DATA',
              telefono2:
                externalData?.variables?.contactMedio_2?.value ||
                externalData?.variables?.phone?.value ||
                'NO-DATA',
              telefono3:
                externalData?.variables?.contactMedio_3?.value || 'NO-DATA',
              correo1:
                externalData?.variables?.contactEmail_1?.value || 'NO-DATA',
              correo2:
                externalData?.variables?.contactEmail_2?.value ||
                externalData?.variables?.email?.value ||
                'NO-DATA',
              cupo: cupo,
              cuota: cuota,
              shawdonQuota: shawdonQuota,
              profileCredit: parseFloat('01'),
              createdBy: userId || 'NO-DATA',
              isActive: true,
              rucData: {
                create: {
                  numeroRuc: rucData.numeroRuc || ruc,
                  razonSocial: rucData.razonSocial || 'NO-DATA',
                  estadoContribuyenteRuc:
                    rucData.estadoContribuyenteRuc || 'NO-DATA',
                  actividadEconomicaPrincipal:
                    rucData.actividadEconomicaPrincipal || 'NO-DATA',
                  tipoContribuyente: rucData.tipoContribuyente || 'NO-DATA',
                  regimen: rucData.regimen || 'NO-DATA',
                  categoria: rucData.categoria,
                  obligadoLlevarContabilidad:
                    rucData.obligadoLlevarContabilidad || 'NO',
                  agenteRetencion: rucData.agenteRetencion || 'NO',
                  contribuyenteEspecial: rucData.contribuyenteEspecial || 'NO',
                  fechaInicioActividades: rucData.informacionFechasContribuyente
                    ?.fechaInicioActividades
                    ? new Date(
                        rucData.informacionFechasContribuyente.fechaInicioActividades,
                      )
                    : null,
                  fechaCese: rucData.informacionFechasContribuyente?.fechaCese
                    ? new Date(rucData.informacionFechasContribuyente.fechaCese)
                    : null,
                  fechaReinicioActividades: rucData
                    .informacionFechasContribuyente?.fechaReinicioActividades
                    ? new Date(
                        rucData.informacionFechasContribuyente.fechaReinicioActividades,
                      )
                    : null,
                  fechaActualizacion: rucData.informacionFechasContribuyente
                    ?.fechaActualizacion
                    ? new Date(
                        rucData.informacionFechasContribuyente.fechaActualizacion,
                      )
                    : null,
                  motivoCancelacionSuspension:
                    rucData.motivoCancelacionSuspension,
                  contribuyenteFantasma: rucData.contribuyenteFantasma || 'NO',
                  transaccionesInexistente:
                    rucData.transaccionesInexistente || 'NO',
                  clasificacionMiPyme: rucData.clasificacionMiPyme,
                  establecimientos: rucData.establecimientos || [],
                  representantesLegales: rucData.representantesLegales || [],
                  error: rucData.error || null,
                },
              },
              penalData: {
                create: {
                  identityNumber: identityNumber,
                  denuncias: penalData.denuncias || [],
                  total: penalData.total || 0,
                  error: penalData.error || null,
                },
              },
            },
          });

          console.log(`=== DATABASE SAVE SUCCESSFUL for ${identityNumber} ===`);
          console.log('Saved consult ID:', savedConsult?.id);

          results.push({
            identityNumber,
            id: savedConsult?.id,
            message: 'Consult created successfully',
          });

          console.log(`✅ SUCCESS: ${identityNumber} processed`);

          // Delay entre transacciones individuales
          await this.delay(DELAY_BETWEEN_TRANSACTIONS);
        } catch (error) {
          console.error(`❌ ERROR for ${identityNumber}:`, error);
          errors.push({
            identityNumber,
            error: error.message || 'Unknown error occurred',
          });
        }
      }

      // Delay entre lotes (excepto en el último lote)
      if (i + BATCH_SIZE < numbersToProcess.length) {
        console.log(
          `⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`,
        );
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log(`\n=== PROCESSING COMPLETED ===`);
    console.log(`✅ Successful: ${results.length}`);
    console.log(`❌ Errors: ${errors.length}`);

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        type: 'Massive',
        status: 'completed',
        isActive: false,
        isEnabled: false,
        message: `Processed ${identityNumbers.length} identity numbers (${results.length} successful, ${errors.length} errors)`,
        successCount: results.length,
        errorCount: errors.length,
        datajson: { results, errors },
      },
    });

    return {
      message: `Processed ${identityNumbers.length} identity numbers (${results.length} successful, ${errors.length} errors)`,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Helper method for delays
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Method to check transaction status
  async getTransactionStatus(transactionId: string) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        select: {
          id: true,
          type: true,
          status: true,
          message: true,
          successCount: true,
          errorCount: true,
          datajson: true,
          createdAt: true,
          isActive: true,
        },
      });

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      return {
        success: true,
        data: transaction,
        message: 'Transaction status retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw new InternalServerErrorException(
        'Failed to get transaction status',
      );
    }
  }

  async findAll(
    paginationDto?: PaginationDto,
    search?: string,
  ): Promise<PaginatedResponse<any>> {
    try {
      const page = paginationDto?.page || 1;
      const limit = paginationDto?.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause with optional search filter
      const whereClause: any = {
        isActive: true,
      };

      // Add search filter for identityNumber if provided
      if (search && search.trim() !== '') {
        whereClause.identityNumber = {
          contains: search.trim(),
        };
      }

      // Get total count
      const totalItems = await this.prisma.databookConsult.count({
        where: whereClause,
      });

      // Get paginated data
      const consults = await this.prisma.databookConsult.findMany({
        select: {
          id: true,
          identityNumber: true,
          fullname: true,
          sexo: true,
          edad: true,
          civilStatus: true,
          cargas: true,
          dependenceName: true,
          dependenceStart: true,
          dependencePosition: true,
          dependenceAddress: true,
          dependenceRango1: true,
          dependenceRango2: true,
          nacionalidad: true,
          conyuge: true,
          calleDomicilio: true,
          numeracionDomicilio: true,
          nombreMadre: true,
          nombrePadre: true,
          lugarNacimiento: true,
          instruccion: true,
          profesion: true,
          createdAt: true,
          telefono1: true,
          telefono2: true,
          telefono3: true,
          correo1: true,
          correo2: true,
          cupo: true,
          cuota: true,
          profileCredit: true,
          shawdonQuota: true,
          rucData: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          penalData: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          transitDatas: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          vehicleDatas: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      });

      const totalPages = Math.ceil(totalItems / limit);

      return {
        message: 'All consults retrieved successfully',
        data: consults,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new InternalServerErrorException('Failed to retrieve consults');
    }
  }

  async findOne(id: string) {
    // Get a specific databook consult by ID
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const consult = await this.prisma.databookConsult.findUnique({
      where: {
        id: id,
      },
      include: {
        rucData: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        penalData: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        vehicleDatas: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!consult) {
      throw new Error('Consult not found');
    }

    return {
      message: 'Consult retrieved successfully',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: consult,
    };
  }

  async findByIdentityNumber(identityNumber: string) {
    // Get consults by identity number
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const consults = await this.prisma.databookConsult.findMany({
      where: {
        identityNumber: identityNumber,
        isActive: true,
      },
      include: {
        rucData: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        penalData: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        vehicleDatas: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Consults retrieved successfully',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: consults,
    };
  }

  update(id: string, updateConsultDto: UpdateConsultDto) {
    // Implementar lógica de actualización de consulta
    return {
      message: 'Consult updated successfully',
      data: { id, ...updateConsultDto },
    };
  }

  async remove(id: string) {
    // Soft delete - mark as inactive
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const consult = await this.prisma.databookConsult.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Consult deleted successfully',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: consult,
    };
  }

  search(searchDto: any) {
    // Implementar lógica de búsqueda
    return {
      message: 'Search completed successfully',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { searchDto, results: [] },
    };
  }

  async getConsultsByUser(userId: string) {
    // Get consults created by a specific user
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const consults = await this.prisma.databookConsult.findMany({
      where: {
        createdBy: userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'User consults retrieved successfully',
      data: consults,
    };
  }

  async exportToCSV(): Promise<string> {
    try {
      console.log('=== STARTING CSV EXPORT ===');

      // Get all active consults
      const allConsults = await this.prisma.databookConsult.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(`Found ${allConsults.length} consults to export`);

      if (allConsults.length === 0) {
        throw new InternalServerErrorException('No data to export');
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `consults-export-${timestamp}.csv`;
      const filepath = path.join(uploadsDir, filename);

      // Define CSV headers
      const csvWriter = createCsvWriter.createObjectCsvWriter({
        path: filepath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'identityNumber', title: 'Número de Identidad' },
          { id: 'fullname', title: 'Nombre Completo' },
          { id: 'sexo', title: 'Sexo' },
          { id: 'edad', title: 'Edad' },
          { id: 'civilStatus', title: 'Estado Civil' },
          { id: 'cargas', title: 'Cargas' },
          { id: 'dependenceName', title: 'Nombre de Dependencia' },
          { id: 'dependenceStart', title: 'Inicio en Dependencia' },
          { id: 'dependencePosition', title: 'Posición en Dependencia' },
          { id: 'dependenceAddress', title: 'Dirección de Dependencia' },
          { id: 'dependenceRango1', title: 'Rango Salarial 1' },
          { id: 'dependenceRango2', title: 'Rango Salarial 2' },
          { id: 'nacionalidad', title: 'Nacionalidad' },
          { id: 'conyuge', title: 'Cónyuge' },
          { id: 'calleDomicilio', title: 'Calle de Domicilio' },
          { id: 'numeracionDomicilio', title: 'Numeración de Domicilio' },
          { id: 'nombreMadre', title: 'Nombre de la Madre' },
          { id: 'nombrePadre', title: 'Nombre del Padre' },
          { id: 'lugarNacimiento', title: 'Lugar de Nacimiento' },
          { id: 'instruccion', title: 'Instrucción' },
          { id: 'profesion', title: 'Profesión' },
          { id: 'cuota', title: 'Cuota' },
          { id: 'cupo', title: 'Cupo' },
          { id: 'shawdonQuota', title: 'Cupo Sombra' },
          { id: 'createdBy', title: 'Creado Por' },
          { id: 'createdAt', title: 'Fecha de Creación' },
          { id: 'updatedAt', title: 'Fecha de Actualización' },
        ],
      });

      // Format data for CSV
      const csvData = allConsults.map((consult) => ({
        id: consult.id,
        identityNumber: consult.identityNumber,
        fullname: consult.fullname,
        sexo: consult.sexo,
        edad: consult.edad,
        civilStatus: consult.civilStatus,
        cargas: consult.cargas,
        dependenceName: consult.dependenceName,
        dependenceStart:
          consult.dependenceStart?.toISOString().split('T')[0] || 'NO-DATA',
        dependencePosition: consult.dependencePosition,
        dependenceAddress: consult.dependenceAddress,
        dependenceRango1: consult.dependenceRango1,
        dependenceRango2: consult.dependenceRango2,
        nacionalidad: consult.nacionalidad,
        conyuge: consult.conyuge,
        calleDomicilio: consult.calleDomicilio,
        numeracionDomicilio: consult.numeracionDomicilio,
        nombreMadre: consult.nombreMadre,
        nombrePadre: consult.nombrePadre,
        lugarNacimiento: consult.lugarNacimiento,
        instruccion: consult.instruccion,
        profesion: consult.profesion,
        cuota: consult.cuota,
        cupo: consult.cupo,
        cupoSombra: consult.shawdonQuota,
        createdBy: consult.createdBy,
        createdAt: consult.createdAt.toISOString(),
        updatedAt: consult.updatedAt.toISOString(),
      }));

      // Write CSV file
      await csvWriter.writeRecords(csvData);

      console.log(`=== CSV EXPORT SUCCESSFUL ===`);
      console.log(`File saved to: ${filepath}`);

      return filepath;
    } catch (error) {
      console.error('CSV Export error:', error);
      throw new InternalServerErrorException('Failed to export data to CSV');
    }
  }

  private parseDate(dateString: string | undefined): Date {
    console.log('parseDate input:', dateString);

    if (!dateString || dateString === 'NO-DATA' || dateString.trim() === '') {
      console.log('parseDate: returning current date for invalid input');
      return new Date();
    }

    // Handle different date formats
    // Format: YYYY-MM-DD
    if (dateString.includes('-')) {
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) {
        console.log(
          'parseDate: invalid YYYY-MM-DD format, returning current date',
        );
        return new Date();
      }
      return parsedDate;
    }

    // Format: MM/DD/YYYY
    if (dateString.includes('/')) {
      const [month, day, year] = dateString.split('/');
      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      );
      if (isNaN(parsedDate.getTime())) {
        console.log(
          'parseDate: invalid MM/DD/YYYY format, returning current date',
        );
        return new Date();
      }
      return parsedDate;
    }

    // Fallback: try to parse as is
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      console.log('parseDate: fallback parsing failed, returning current date');
      return new Date();
    }
    return parsedDate;
  }

  private calculateAge(birthdayString: string | undefined): number {
    if (!birthdayString) {
      return 0;
    }

    const birthDate = this.parseDate(birthdayString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age > 0 ? age : 0;
  }

  async recalculateData() {
    console.log('=== STARTING RECALCULATION PROCESS ===');

    const BATCH_SIZE = 100; // Procesar de 100 en 100
    let processedCount = 0;
    let errorCount = 0;
    let offset = 0;

    // Obtener el factor una sola vez (optimización)
    const factor = await this.prisma.factor.findFirst({
      where: {
        scoreBuroMinimo: { lte: 700 },
        scoreBuroMaximo: { gte: 700 },
        type: 'con_score',
      },
    });

    if (!factor) {
      throw new InternalServerErrorException('Factor not found for score 700');
    }

    console.log('Factor found:', factor);

    // Obtener el total de registros
    const totalRecords = await this.prisma.databookConsult.count({
      where: {
        isActive: true,
      },
    });

    console.log(`Total records to process: ${totalRecords}`);

    // Procesar en lotes
    while (offset < totalRecords) {
      try {
        console.log(
          `\n=== PROCESSING BATCH: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRecords)} ===`,
        );

        // Obtener lote de consultas
        const consultsBatch = await this.prisma.databookConsult.findMany({
          select: {
            id: true,
            dependenceRango2: true,
          },
          where: {
            isActive: true,
          },
          skip: offset,
          take: BATCH_SIZE,
          orderBy: {
            id: 'asc', // Para consistencia en la paginación
          },
        });

        if (consultsBatch.length === 0) {
          break;
        }

        // Preparar actualizaciones en lote
        const updatePromises = consultsBatch.map(async (consult) => {
          try {
            const dependenceRango2 = consult.dependenceRango2 || 0;
            const factorPromedio = factor.factorPromedio || 0.4;
            let cupo = dependenceRango2 * factorPromedio;

            // Validar que el cupo no sea mayor a 333
            if (cupo > 333) {
              cupo = 333;
            }

            let shawdonQuota = dependenceRango2 * (factor.factorSombra || 0.0);

            // Validar que el shawdonQuota no sea mayor a 333
            if (shawdonQuota > 333) {
              shawdonQuota = 333;
            }

            const cuota = cupo * 30 > 5000 ? 5000 : cupo * 30;

            return this.prisma.databookConsult.update({
              where: { id: consult.id },
              data: {
                cupo: cupo,
                cuota: cuota,
                shawdonQuota: shawdonQuota,
              },
            });
          } catch (error) {
            console.error(`Error updating consult ${consult.id}:`, error);
            errorCount++;
            return null;
          }
        });

        // Ejecutar todas las actualizaciones del lote en paralelo
        await Promise.allSettled(updatePromises);

        processedCount += consultsBatch.length;
        offset += BATCH_SIZE;

        console.log(
          `✅ Batch completed. Progress: ${processedCount}/${totalRecords} (${Math.round((processedCount / totalRecords) * 100)}%)`,
        );
      } catch (error) {
        console.error('Batch processing error:', error);
        errorCount += BATCH_SIZE;
        offset += BATCH_SIZE;
      }
    }

    console.log('\n=== RECALCULATION COMPLETED ===');
    console.log(`✅ Total processed: ${processedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    return {
      message: 'Cupos recalculated successfully',
      processedCount,
      errorCount,
      totalRecords,
    };
  }

  async generateConsultPDF(id: string): Promise<Buffer> {
    try {
      console.log('=== GENERATING PDF FOR CONSULT ===');
      console.log('Consult ID:', id);

      // Get consult data with transit info
      const consult = await this.prisma.databookConsult.findUnique({
        where: { id },
        include: {
          rucData: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          penalData: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          transitDatas: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!consult) {
        throw new NotFoundException('Consult not found');
      }

      return new Promise((resolve, reject) => {
        try {
          // Create PDF document
          const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
          });

          const buffers: Buffer[] = [];

          // Collect data chunks
          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            console.log('PDF generated successfully, size:', pdfBuffer.length);
            resolve(pdfBuffer);
          });

          doc.on('error', (error) => {
            console.error('PDF generation error:', error);
            reject(error);
          });

          // Add header
          doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('REPORTE DE CONSULTA DATABOOK', { align: 'center' })
            .moveDown();

          // Add date
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(
              `Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`,
              { align: 'right' },
            )
            .moveDown(1.5);

          // Personal Information Section
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN PERSONAL')
            .moveDown(0.5);

          doc.fontSize(10).font('Helvetica').fillColor('#000000');

          const personalInfo = [
            {
              label: 'Número de Identidad:',
              value: consult.identityNumber || 'N/A',
            },
            { label: 'Nombre Completo:', value: consult.fullname || 'N/A' },
            { label: 'Sexo:', value: consult.sexo || 'N/A' },
            { label: 'Edad:', value: consult.edad?.toString() || 'N/A' },
            { label: 'Estado Civil:', value: consult.civilStatus || 'N/A' },
            {
              label: 'Cargas Familiares:',
              value: consult.cargas?.toString() || '0',
            },
            { label: 'Nacionalidad:', value: consult.nacionalidad || 'N/A' },
            { label: 'Cónyuge:', value: consult.conyuge || 'N/A' },
            {
              label: 'Lugar de Nacimiento:',
              value: consult.lugarNacimiento || 'N/A',
            },
            { label: 'Instrucción:', value: consult.instruccion || 'N/A' },
            { label: 'Profesión:', value: consult.profesion || 'N/A' },
          ];

          personalInfo.forEach((info) => {
            doc
              .font('Helvetica-Bold')
              .text(info.label, { continued: true })
              .font('Helvetica')
              .text(` ${info.value}`)
              .moveDown(0.3);
          });

          doc.moveDown(1);

          // Address Information Section
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN DE DOMICILIO')
            .moveDown(0.5);

          doc.fontSize(10).font('Helvetica').fillColor('#000000');

          const addressInfo = [
            {
              label: 'Calle de Domicilio:',
              value: consult.calleDomicilio || 'N/A',
            },
            {
              label: 'Numeración:',
              value: consult.numeracionDomicilio || 'N/A',
            },
            {
              label: 'Nombre de la Madre:',
              value: consult.nombreMadre || 'N/A',
            },
            { label: 'Nombre del Padre:', value: consult.nombrePadre || 'N/A' },
          ];

          addressInfo.forEach((info) => {
            doc
              .font('Helvetica-Bold')
              .text(info.label, { continued: true })
              .font('Helvetica')
              .text(` ${info.value}`)
              .moveDown(0.3);
          });

          doc.moveDown(1);

          // Employment Information Section
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN LABORAL')
            .moveDown(0.5);

          doc.fontSize(10).font('Helvetica').fillColor('#000000');

          const employmentInfo = [
            {
              label: 'Nombre de la Empresa:',
              value: consult.dependenceName || 'N/A',
            },
            {
              label: 'Fecha de Inicio:',
              value:
                consult.dependenceStart?.toLocaleDateString('es-ES') || 'N/A',
            },
            {
              label: 'Cargo/Posición:',
              value: consult.dependencePosition || 'N/A',
            },
            {
              label: 'Dirección Laboral:',
              value: consult.dependenceAddress || 'N/A',
            },
            {
              label: 'Rango Salarial 1:',
              value: `$${consult.dependenceRango1?.toFixed(2) || '0.00'}`,
            },
            {
              label: 'Rango Salarial 2:',
              value: `$${consult.dependenceRango2?.toFixed(2) || '0.00'}`,
            },
          ];

          employmentInfo.forEach((info) => {
            doc
              .font('Helvetica-Bold')
              .text(info.label, { continued: true })
              .font('Helvetica')
              .text(` ${info.value}`)
              .moveDown(0.3);
          });

          doc.moveDown(1);

          // Contact Information Section
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN DE CONTACTO')
            .moveDown(0.5);

          doc.fontSize(10).font('Helvetica').fillColor('#000000');

          const contactInfo = [
            { label: 'Teléfono 1:', value: consult.telefono1 || 'N/A' },
            { label: 'Teléfono 2:', value: consult.telefono2 || 'N/A' },
            { label: 'Teléfono 3:', value: consult.telefono3 || 'N/A' },
            { label: 'Correo 1:', value: consult.correo1 || 'N/A' },
            { label: 'Correo 2:', value: consult.correo2 || 'N/A' },
          ];

          contactInfo.forEach((info) => {
            doc
              .font('Helvetica-Bold')
              .text(info.label, { continued: true })
              .font('Helvetica')
              .text(` ${info.value}`)
              .moveDown(0.3);
          });

          doc.moveDown(1);

          // Credit Information Section
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN CREDITICIA')
            .moveDown(0.5);

          doc.fontSize(10).font('Helvetica').fillColor('#000000');

          const creditInfo = [
            {
              label: 'Cupo Asignado:',
              value: `$${consult.cupo?.toFixed(2) || '0.00'}`,
            },
            {
              label: 'Cuota Mensual:',
              value: `$${consult.cuota?.toFixed(2) || '0.00'}`,
            },
            {
              label: 'Cupo Sombra:',
              value: `$${consult.shawdonQuota?.toFixed(2) || '0.00'}`,
            },
            {
              label: 'Perfil de Crédito:',
              value: consult.profileCredit?.toString() || 'N/A',
            },
          ];

          creditInfo.forEach((info) => {
            doc
              .font('Helvetica-Bold')
              .text(info.label, { continued: true })
              .font('Helvetica')
              .text(` ${info.value}`)
              .moveDown(0.3);
          });

          doc.moveDown(1);

          // Transit Data Section
          if (consult.transitDatas && consult.transitDatas.length > 0) {
            const transit = consult.transitDatas[0];
            doc
              .fontSize(14)
              .font('Helvetica-Bold')
              .fillColor('#2c3e50')
              .text('INFORMACIÓN DE TRÁNSITO')
              .moveDown(0.5);
            doc.fontSize(10).font('Helvetica').fillColor('#000000');

            const transitInfo = [
              { label: 'Placa:', value: transit.placa || 'N/A' },
              { label: 'ID Persona:', value: transit.idPersona || 'N/A' },
              { label: 'Mensaje:', value: transit.mensaje || 'N/A' },
            ];
            transitInfo.forEach((info) => {
              doc
                .font('Helvetica-Bold')
                .text(info.label, { continued: true })
                .font('Helvetica')
                .text(` ${info.value}`)
                .moveDown(0.3);
            });

            // Multas pagadas (finesPaid)
            let finesPaid = transit.finesPaid;
            if (typeof finesPaid === 'string') {
              try {
                finesPaid = JSON.parse(finesPaid);
              } catch (e) {
                finesPaid = null;
              }
            }
            if (
              finesPaid &&
              Array.isArray(finesPaid?.['rows']) &&
              finesPaid?.['rows'].length > 0
            ) {
              doc.moveDown(0.5);
              doc
                .font('Helvetica-Bold')
                .text('Multas registradas:')
                .moveDown(0.3);
              finesPaid?.['rows'].forEach((item: any, idx: number) => {
                doc.font('Helvetica-Bold').text(`  Multa #${idx + 1}`);
                doc
                  .font('Helvetica')
                  .text(
                    `    Entidad: ${item.cell && item.cell.length > 2 ? item.cell[2] : 'N/A'}`,
                  );
                doc
                  .font('Helvetica')
                  .text(
                    `    Placa: ${item.cell && item.cell.length > 4 ? item.cell[4] : 'N/A'}`,
                  );
                doc
                  .font('Helvetica')
                  .text(
                    `    Fecha: ${item.cell && item.cell.length > 6 ? item.cell[6] : 'N/A'}`,
                  );
                doc
                  .font('Helvetica')
                  .text(
                    `    Descripción: ${item.cell && item.cell.length > 17 ? item.cell[17] : 'N/A'}`,
                  );
                // Información vehicular si existe
                if (item.cell && item.cell.length > 10) {
                  doc
                    .font('Helvetica')
                    .text(`    Marca: ${item.cell[10] || 'N/A'}`);
                  doc
                    .font('Helvetica')
                    .text(`    Modelo: ${item.cell[11] || 'N/A'}`);
                  doc
                    .font('Helvetica')
                    .text(`    Color: ${item.cell[12] || 'N/A'}`);
                  doc
                    .font('Helvetica')
                    .text(`    Clase: ${item.cell[13] || 'N/A'}`);
                  doc
                    .font('Helvetica')
                    .text(`    Servicio: ${item.cell[14] || 'N/A'}`);
                }
                doc.moveDown(0.2);
              });
            } else {
              doc
                .font('Helvetica')
                .text('No se encontraron multas registradas.')
                .moveDown(0.3);
            }
            doc.moveDown(1);
          }

          // RUC Information Section (if available)
          if (consult.rucData && consult.rucData.length > 0) {
            const rucInfo = consult.rucData[0];

            doc
              .fontSize(14)
              .font('Helvetica-Bold')
              .fillColor('#2c3e50')
              .text('INFORMACIÓN DEL RUC')
              .moveDown(0.5);

            doc.fontSize(10).font('Helvetica').fillColor('#000000');

            const rucDetails = [
              { label: 'Número RUC:', value: rucInfo.numeroRuc || 'N/A' },
              { label: 'Razón Social:', value: rucInfo.razonSocial || 'N/A' },
              {
                label: 'Estado del Contribuyente:',
                value: rucInfo.estadoContribuyenteRuc || 'N/A',
              },
              {
                label: 'Actividad Económica Principal:',
                value: rucInfo.actividadEconomicaPrincipal || 'N/A',
              },
              {
                label: 'Tipo de Contribuyente:',
                value: rucInfo.tipoContribuyente || 'N/A',
              },
              { label: 'Régimen:', value: rucInfo.regimen || 'N/A' },
              { label: 'Categoría:', value: rucInfo.categoria || 'N/A' },
              {
                label: 'Obligado a Llevar Contabilidad:',
                value: rucInfo.obligadoLlevarContabilidad || 'NO',
              },
              {
                label: 'Agente de Retención:',
                value: rucInfo.agenteRetencion || 'NO',
              },
              {
                label: 'Contribuyente Especial:',
                value: rucInfo.contribuyenteEspecial || 'NO',
              },
              {
                label: 'Contribuyente Fantasma:',
                value: rucInfo.contribuyenteFantasma || 'NO',
              },
              {
                label: 'Transacciones Inexistentes:',
                value: rucInfo.transaccionesInexistente || 'NO',
              },
              {
                label: 'Clasificación MiPyme:',
                value: rucInfo.clasificacionMiPyme || 'N/A',
              },
              {
                label: 'Fecha Inicio Actividades:',
                value: rucInfo.fechaInicioActividades
                  ? rucInfo.fechaInicioActividades.toLocaleDateString('es-ES')
                  : 'N/A',
              },
              {
                label: 'Fecha de Cese:',
                value: rucInfo.fechaCese
                  ? rucInfo.fechaCese.toLocaleDateString('es-ES')
                  : 'N/A',
              },
              {
                label: 'Fecha Reinicio Actividades:',
                value: rucInfo.fechaReinicioActividades
                  ? rucInfo.fechaReinicioActividades.toLocaleDateString('es-ES')
                  : 'N/A',
              },
              {
                label: 'Última Actualización:',
                value: rucInfo.fechaActualizacion
                  ? rucInfo.fechaActualizacion.toLocaleDateString('es-ES')
                  : 'N/A',
              },
            ];

            if (rucInfo.motivoCancelacionSuspension) {
              rucDetails.push({
                label: 'Motivo Cancelación/Suspensión:',
                value: rucInfo.motivoCancelacionSuspension,
              });
            }

            rucDetails.forEach((info) => {
              doc
                .font('Helvetica-Bold')
                .text(info.label, { continued: true })
                .font('Helvetica')
                .text(` ${info.value}`)
                .moveDown(0.3);
            });

            // Add establishments if available
            if (
              rucInfo.establecimientos &&
              Array.isArray(rucInfo.establecimientos) &&
              rucInfo.establecimientos.length > 0
            ) {
              doc.moveDown(0.5);
              doc
                .font('Helvetica-Bold')
                .text('Establecimientos Registrados:')
                .moveDown(0.3);
              doc
                .font('Helvetica')
                .text(
                  `Total de establecimientos: ${rucInfo.establecimientos.length}`,
                )
                .moveDown(0.3);
            }

            // Add legal representatives if available
            if (
              rucInfo.representantesLegales &&
              Array.isArray(rucInfo.representantesLegales) &&
              rucInfo.representantesLegales.length > 0
            ) {
              doc.moveDown(0.5);
              doc
                .font('Helvetica-Bold')
                .text('Representantes Legales:')
                .moveDown(0.3);
              doc
                .font('Helvetica')
                .text(
                  `Total de representantes: ${rucInfo.representantesLegales.length}`,
                )
                .moveDown(0.3);
            }

            doc.moveDown(1);
          }

          // Penal Information Section (if available)
          if (consult.penalData && consult.penalData.length > 0) {
            const penalInfo = consult.penalData[0];

            const safeJsonParse = (value: any) => {
              if (typeof value !== 'string') return null;
              try {
                return JSON.parse(value);
              } catch {
                return null;
              }
            };

            doc
              .fontSize(14)
              .font('Helvetica-Bold')
              .fillColor('#2c3e50')
              .text('INFORMACIÓN PENAL')
              .moveDown(0.5);

            doc.fontSize(10).font('Helvetica').fillColor('#000000');

            const penalDetails = [
              {
                label: 'Número de Identificación:',
                value: penalInfo.identityNumber || 'N/A',
              },
              {
                label: 'Total de Procesos:',
                value: penalInfo.total?.toString() || '0',
              },
            ];

            penalDetails.forEach((info) => {
              doc
                .font('Helvetica-Bold')
                .text(info.label, { continued: true })
                .font('Helvetica')
                .text(` ${info.value}`)
                .moveDown(0.3);
            });

            // Add procesos details if available
            if (
              penalInfo.denuncias &&
              Array.isArray(penalInfo.denuncias) &&
              penalInfo.denuncias.length > 0
            ) {
              doc.moveDown(0.5);
              doc
                .font('Helvetica-Bold')
                .fillColor('#e74c3c')
                .text('PROCESOS JUDICIALES REGISTRADOS:')
                .moveDown(0.5);

              penalInfo.denuncias.forEach((proceso: any, index: number) => {
                doc.fillColor('#000000');
                doc
                  .font('Helvetica-Bold')
                  .text(`Proceso #${index + 1}`)
                  .moveDown(0.3);

                const procesoDetails = [
                  {
                    label: 'ID Juicio:',
                    value: proceso.idJuicio || 'N/A',
                  },
                  {
                    label: 'Estado Actual:',
                    value: proceso.estadoActual || 'N/A',
                  },
                  {
                    label: 'Materia:',
                    value: proceso.idMateria?.toString?.() || 'N/A',
                  },
                  {
                    label: 'Delito:',
                    value: proceso.nombreDelito || 'N/A',
                  },
                  {
                    label: 'Fecha Ingreso:',
                    value: proceso.fechaIngreso
                      ? new Date(proceso.fechaIngreso).toLocaleDateString('es-ES')
                      : 'N/A',
                  },
                ];

                const rootDemandodos =
                  safeJsonParse(proceso.rootDemandodos) ?? proceso.rootDemandodos;
                const rootIncidenteJudicaturas =
                  safeJsonParse(proceso.rootIncidenteJudicaturas) ??
                  proceso.rootIncidenteJudicaturas;

                if (Array.isArray(rootDemandodos) && rootDemandodos.length > 0) {
                  const d = rootDemandodos[0];
                  procesoDetails.push({
                    label: 'Nombre Materia:',
                    value: d?.nombreMateria || 'N/A',
                  });
                  procesoDetails.push({
                    label: 'Tipo Acción:',
                    value: d?.nombreTipoAccion || 'N/A',
                  });
                }

                procesoDetails.forEach((detail) => {
                  doc
                    .font('Helvetica-Bold')
                    .text(`  ${detail.label}`, { continued: true })
                    .font('Helvetica')
                    .text(` ${detail.value}`)
                    .moveDown(0.2);
                });

                if (
                  Array.isArray(rootIncidenteJudicaturas) &&
                  rootIncidenteJudicaturas.length > 0
                ) {
                  const firstJudicatura = rootIncidenteJudicaturas[0];
                  const firstIncidente = Array.isArray(
                    firstJudicatura?.lstIncidenteJudicatura,
                  )
                    ? firstJudicatura.lstIncidenteJudicatura[0]
                    : null;

                  const demandados = Array.isArray(firstIncidente?.lstLitiganteDemandado)
                    ? firstIncidente.lstLitiganteDemandado
                    : [];

                  if (demandados.length > 0) {
                    doc.moveDown(0.3);
                    doc.font('Helvetica-Bold').text('  Demandados:');
                    demandados.forEach((d: any) => {
                      doc
                        .font('Helvetica')
                        .text(`    - ${d?.nombresLitigante || 'N/A'}`)
                        .moveDown(0.2);
                    });
                  }
                }

                doc.moveDown(0.5);
              });
            } else {
              doc
                .font('Helvetica')
                .fillColor('#27ae60')
                .text('No se encontraron procesos judiciales registrados.')
                .moveDown(0.5);
            }

            doc.moveDown(1);
          }

          doc.moveDown(1);

          // Footer
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#7f8c8d')
            .text(
              `Documento generado por el sistema Databook el ${new Date().toLocaleString('es-ES')}`,
              { align: 'center' },
            )
            .moveDown(0.3)
            .text('Este documento es confidencial y de uso interno', {
              align: 'center',
            });

          // Finalize PDF
          doc.end();
        } catch (error) {
          console.error('Error creating PDF document:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('PDF Generation error:', error);
      throw new InternalServerErrorException('Failed to generate PDF');
    }
  }

  async consultTransitData(identificacion: string, databookConsultId: string) {
    const urlBase = process.env.API_TRANSITO;
    if (!urlBase) {
      throw new Error('API_TRANSITO not set in environment variables');
    }

    //validar si ya existe la consulta
    const consultExist = await this.prisma.transitData.findFirst({
      where: {
        databookConsultId: databookConsultId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (consultExist && consultExist.finesPaid) {
      console.log(
        'Returning existing transit data for consult ID:',
        databookConsultId,
      );
      const finesData = consultExist.finesPaid;
      if (finesData && Array.isArray(finesData['rows'])) {
        return {
          person: consultExist.idPersona,
          fines: finesData?.['rows'].map((item: any) => ({
            id: item.id,
            entity: item.cell && item.cell.length > 2 ? item.cell[2] : null,
            placa: item.cell && item.cell.length > 4 ? item.cell[4] : null,
            date: item.cell && item.cell.length > 6 ? item.cell[6] : null,
            description:
              item.cell && item.cell.length > 17 ? item.cell[17] : null,
          })),
        };
      }
      // Si finesData es un array directo
      if (Array.isArray(finesData)) {
        return finesData.map((item: any) => ({
          person: consultExist.idPersona,
          id: item.id,
          numeroCita: item.cell && item.cell.length > 2 ? item.cell[2] : null,
        }));
      }
      // Si no hay datos válidos
      return [];
    }

    const url = `${urlBase}clp_json_consulta_persona.jsp`;
    const params = new URLSearchParams();
    params.append('ps_tipo_identificacion', 'CED');
    params.append('ps_identificacion', identificacion);

    const response = await axios.post(
      url + '?' + params.toString(),
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(response.data);
    const data = response.data;
    const transitRecord = await this.prisma.transitData.create({
      data: {
        idContrato: data.id_contrato ?? null,
        placa: data.placa ?? null,
        idPersona: data.id_persona ?? null,
        mensaje: data.mensaje ?? null,
        databookConsultId: databookConsultId,
      },
    });

    const consultTransit = await this.consultTransiPaid(
      transitRecord.id,
      identificacion,
      data.id_persona,
    );
    console.log(consultTransit.rows);
    if (consultTransit && Array.isArray(consultTransit.rows)) {
      return {
        person: response.data.id_persona,
        fines: consultTransit.rows.map((item: any) => ({
          id: item.id,
          entity: item.cell && item.cell.length > 2 ? item.cell[2] : null,
          placa: item.cell && item.cell.length > 4 ? item.cell[4] : null,
          date: item.cell && item.cell.length > 6 ? item.cell[6] : null,
          description:
            item.cell && item.cell.length > 17 ? item.cell[17] : null,
        })),
      };
    }
    // Si consultTransit es un array directo
    if (Array.isArray(consultTransit)) {
      return consultTransit.map((item: any) => ({
        person: response.data.id_persona,
        id: item.id,
        numeroCita: item.cell && item.cell.length > 2 ? item.cell[2] : null,
      }));
    }
    // Si no hay datos válidos
    return [];
  }
  async consultTransiPaid(
    idTransit: string,
    identificacion: string,
    idPerson: string,
  ) {
    try {
      const urlBase = process.env.API_TRANSITO;
      if (!urlBase) {
        throw new Error('API_TRANSITO not set in environment variables');
      }
      const url = `${urlBase}clp_json_citaciones.jsp`;
      const params = new URLSearchParams();
      params.append('ps_opcion', 'G');
      params.append('ps_id_contrato', '');
      params.append('ps_id_persona', idPerson);
      params.append('ps_placa', '');
      params.append('ps_identificacion', identificacion);
      params.append('ps_tipo_identificacion', 'CED');
      params.append('_search', 'false');
      params.append('nd', '1770212116778');
      params.append('rows', '50');
      params.append('page', '1');
      params.append('sidx', 'fecha_emision');
      params.append('sord', 'desc');

      const response = await axios.post(
        url + '?' + params.toString(),
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const data: any = response.data;
      await this.prisma.transitData.update({
        data: {
          finesPaid: data ?? null,
        },
        where: {
          id: idTransit,
        },
      });
      return data;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
