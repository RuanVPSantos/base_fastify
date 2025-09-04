import { z } from 'zod';

export function zodToFastify(schema: z.ZodObject<any>) {
    const shape = schema.shape;
    const result: any = {};

    if (shape.body) {
        result.body = zodSchemaToJsonSchema(shape.body);
    }
    if (shape.querystring) {
        result.querystring = zodSchemaToJsonSchema(shape.querystring);
    }
    if (shape.params) {
        result.params = zodSchemaToJsonSchema(shape.params);
    }
    if (shape.headers) {
        result.headers = zodSchemaToJsonSchema(shape.headers);
    }
    if (shape.response) {
        result.response = {};
        const responseShape = shape.response.shape;
        for (const [statusCode, responseSchema] of Object.entries(responseShape)) {
            result.response[statusCode] = zodSchemaToJsonSchema(responseSchema as z.ZodSchema);
        }
    }

    return result;
}

function zodSchemaToJsonSchema(schema: z.ZodSchema): any {
    if (schema instanceof z.ZodObject) {
        const properties: any = {};
        const required: string[] = [];
        
        for (const [key, value] of Object.entries(schema.shape)) {
            properties[key] = zodSchemaToJsonSchema(value as z.ZodSchema);
            if (!(value as z.ZodSchema).isOptional()) {
                required.push(key);
            }
        }
        
        return {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined
        };
    }
    
    if (schema instanceof z.ZodString) {
        return { type: 'string' };
    }
    
    if (schema instanceof z.ZodNumber) {
        return { type: 'number' };
    }
    
    if (schema instanceof z.ZodBoolean) {
        return { type: 'boolean' };
    }
    
    if (schema instanceof z.ZodArray) {
        return {
            type: 'array',
            items: zodSchemaToJsonSchema(schema.element)
        };
    }
    
    if (schema instanceof z.ZodOptional) {
        return zodSchemaToJsonSchema(schema.unwrap());
    }
    
    if (schema instanceof z.ZodNullable) {
        const innerSchema = zodSchemaToJsonSchema(schema.unwrap());
        return {
            ...innerSchema,
            nullable: true
        };
    }
    
    return {};
}
