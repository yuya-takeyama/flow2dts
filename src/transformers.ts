import { TProgram, TPattern } from 'flow-parser';
import { neverReachHere } from './utils';

const typeAnnotationTypeToType = (typeAnnotationType: string): string => {
  switch (typeAnnotationType) {
  case 'StringTypeAnnotation':
    return 'string';
  default:
    return neverReachHere(`Unnown annotation type: ${typeAnnotationType}`);
  }
};

export function transform(ast: TProgram): string {
  return ast.body.map((statement) => {
    switch (statement.type) {
    case 'ExportDefaultDeclaration':
      return transformParameters(statement.declaration.params);

    default:
      return neverReachHere(`Unhandled expression: ${statement.type}`);
    }
  }).join('\n');
};

export function transformParameters(params: TPattern[]): string {
  return params.map((param: TPattern): string => {
    switch (param.type) {
    case 'Identifier':
      if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
        return `${param.name}: ${typeAnnotationTypeToType(param.typeAnnotation.typeAnnotation.type)}`;
      } else {
        return param.name;
      }

    case 'RestElement':
      switch (param.argument.type) {
      case 'MemberExpression':
      case 'RestElement':
        return neverReachHere('Never be TMemberExpression');

      default:
        if (param.argument.type === 'Identifier') {
          if (param.argument.typeAnnotation && param.argument.typeAnnotation.typeAnnotation) {
            return `...${param.argument.name}: ${typeAnnotationTypeToType(param.argument.typeAnnotation.typeAnnotation.type)}`;
          } else {
            return `...${param.argument.name}`;
          }
        }

        return neverReachHere(`param.argument.type: ${param.argument.type}`);
      }

    default:
      return neverReachHere(`Unknown parameter type: ${param.type}`);
    }
  }).join(', ');
}
