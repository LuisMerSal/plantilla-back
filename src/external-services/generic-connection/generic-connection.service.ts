import {
  //HttpException, HttpStatus,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Prisma } from '@prisma/client';
import axios from 'axios';

export type DniResponse = {
  nacionalidad?: string | null;
  conyuge?: string | null;
  calleDomicilio?: string | null;
  numeracionDomicilio?: string | null;
  nombreMadre?: string | null;
  nombrePadre?: string | null;
  lugarNacimiento?: string | null;
  instruccion?: string | null;
  profesion?: string | null;
  [key: string]: unknown;
};

export type RucResponse = {
  numeroRuc?: string;
  razonSocial?: string;
  estadoContribuyenteRuc?: string;
  actividadEconomicaPrincipal?: string;
  tipoContribuyente?: string;
  regimen?: string;
  categoria?: string | null;
  obligadoLlevarContabilidad?: string;
  agenteRetencion?: string;
  contribuyenteEspecial?: string;
  contribuyenteFantasma?: string;
  transaccionesInexistente?: string;
  clasificacionMiPyme?: string | null;
  establecimientos?: Prisma.JsonValue;
  representantesLegales?: Prisma.JsonValue;
  informacionFechasContribuyente?: {
    fechaInicioActividades?: string;
    fechaCese?: string;
    fechaReinicioActividades?: string;
    fechaActualizacion?: string;
  };
  motivoCancelacionSuspension?: string | null;
  error?: string | null;
  [key: string]: unknown;
};

export type PenalResponse = {
  denuncias: Prisma.JsonValue;
  total: number;
  identityNumber: string;
  error: string | null;
};

export type TransitCarResponse = {
  success: boolean;
  cedula: string;
  total_vehiculos: number;
  vehiculos_consultados: number;
  limite_consultas: number;
  payload: Prisma.JsonValue;
  error: string | null;
};
@Injectable()
export class GenericConnectionService {
  constructor(private httpService: HttpService) {}

  private safeJsonParse<T = any>(value: unknown): T | null {
    if (typeof value !== 'string') return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private formatAxiosError(error: unknown) {
    if (!axios.isAxiosError(error)) {
      return {
        message: error instanceof Error ? error.message : String(error),
      };
    }

    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const responseData = error.response?.data;

    const responseMessage =
      typeof responseData === 'string'
        ? responseData
        : responseData && typeof responseData === 'object'
          ? JSON.stringify(responseData)
          : undefined;

    return {
      message: error.message,
      code: error.code,
      status,
      method,
      url,
      response: responseMessage,
    };
  }

  private headers(apiKey: string, nameApiKeyHeader: string = 'api-key') {
    return {
      headers: {
        // 'api-key': apiKey,
        [nameApiKeyHeader]: apiKey,
        'Content-Type': 'application/json',
      },
    };
  }

  async get(
    url: string,
    apiKey: string,
    data: any,
    nameApiKeyHeader: string = 'api-key',
  ) {
    try {
      const _nameApiKeyHeader =
        nameApiKeyHeader != null && nameApiKeyHeader != ''
          ? nameApiKeyHeader
          : 'api-key';
      const result = await firstValueFrom(
        this.httpService.post<any>(
          url,
          data,
          this.headers(apiKey, _nameApiKeyHeader),
        ),
      );
      // if (url.includes('databook-api/consult')) return result.data.data;
      // else return result.data;
      let current = result;
      while (current.data && typeof current.data === 'object') {
        current = current.data;
      }
      return current;
    } catch (error) {
      console.log('Error fetching Generic POST:', this.formatAxiosError(error));
    }
  }
  //pettion get
  async getByDni(dni: string): Promise<DniResponse | undefined> {
    const api_dni = process.env.API_DNI || '';
    const api_key_dni = process.env.API_KEY_DNI || '';
    //peticion get
    try {
      const result = await firstValueFrom(
        this.httpService.get<DniResponse>(
          `${api_dni}?Cedula=${dni}&Apikey=${api_key_dni}`,
          this.headers(api_key_dni, 'ApiKey'),
        ),
      );
      return result.data;
    } catch (error) {
      console.log('Error fetching DNI data:', this.formatAxiosError(error));
    }
  }

  async getByRuc(ruc: string): Promise<RucResponse> {
    const api_ruc = process.env.API_RUC || '';
    const api_key_ruc = process.env.API_KEY_RUC || '';
    try {
      const result = await firstValueFrom(
        this.httpService.get<RucResponse>(
          `${api_ruc}?Ruc=${ruc}&Apikey=${api_key_ruc}`,
          this.headers(api_key_ruc, 'ApiKey'),
        ),
      );
      return result.data;
    } catch (error) {
      console.log('Error fetching RUC data:', this.formatAxiosError(error));
      return {
        numeroRuc: ruc,
        razonSocial: 'NO-DATA',
        estadoContribuyenteRuc: 'NO-DATA',
        actividadEconomicaPrincipal: 'NO-DATA',
        tipoContribuyente: 'NO-DATA',
        regimen: 'NO-DATA',
        obligadoLlevarContabilidad: 'NO',
        agenteRetencion: 'NO',
        contribuyenteEspecial: 'NO',
        contribuyenteFantasma: 'NO',
        transaccionesInexistente: 'NO',
        establecimientos: [],
        representantesLegales: [],
        error: 'Error al consultar datos del RUC',
      };
    }
  }

  async getByPenal(identityNumber: string): Promise<PenalResponse> {
    const api_penal = process.env.API_PENAL || '';
    try {
      const url = new URL(api_penal);
      url.searchParams.set('cedula', identityNumber);
      url.searchParams.set('demandado', 'true');

      const result = await firstValueFrom(
        this.httpService.get<unknown>(url.toString()),
      );
      const data = result.data;

      const procesos = Array.isArray(data) ? (data as unknown[]) : [];
      const normalizedProcesos = procesos.map((item: unknown) => {
        const record: Record<string, unknown> =
          item && typeof item === 'object'
            ? (item as Record<string, unknown>)
            : {};

        const rootIncidenteJudicaturasParsed =
          this.safeJsonParse(record?.rootIncidenteJudicaturas) ??
          record?.rootIncidenteJudicaturas;
        const rootDemandodosParsed =
          this.safeJsonParse(record?.rootDemandodos) ?? record?.rootDemandodos;

        return {
          ...record,
          rootIncidenteJudicaturas: rootIncidenteJudicaturasParsed,
          rootDemandodos: rootDemandodosParsed,
        } as Record<string, unknown>;
      });

      return {
        denuncias: normalizedProcesos as unknown as Prisma.JsonValue,
        total: normalizedProcesos.length,
        identityNumber,
        error: null,
      };
    } catch (error) {
      console.log('Error fetching Penal data:', this.formatAxiosError(error));
      return {
        denuncias: [],
        total: 0,
        identityNumber,
        error: 'Error al consultar datos penales',
      };
    }
  }

  async getByTransitCar(cedula: string): Promise<TransitCarResponse> {
    const api = process.env.API_TRANSITO_CARRO || '';
    try {
      const url = new URL(api);
      url.searchParams.set('cedula', cedula);

      const result = await firstValueFrom(
        this.httpService.get<Record<string, unknown>>(url.toString()),
      );

      const data = result.data ?? {};
      const success = Boolean(data['success']);
      const totalVehiculosRaw = data['total_vehiculos'];
      const vehiculosConsultadosRaw = data['vehiculos_consultados'];
      const limiteConsultasRaw = data['limite_consultas'];

      const toNumber = (v: unknown) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        }
        return 0;
      };

      return {
        success,
        cedula: String(data['cedula'] ?? cedula),
        total_vehiculos: toNumber(totalVehiculosRaw),
        vehiculos_consultados: toNumber(vehiculosConsultadosRaw),
        limite_consultas: toNumber(limiteConsultasRaw),
        payload: data as unknown as Prisma.JsonValue,
        error: null,
      };
    } catch (error) {
      console.log('Error fetching Transit Car data:', this.formatAxiosError(error));
      return {
        success: false,
        cedula,
        total_vehiculos: 0,
        vehiculos_consultados: 0,
        limite_consultas: 0,
        payload: null,
        error: 'Error al consultar datos de vehículos',
      };
    }
  }
}
