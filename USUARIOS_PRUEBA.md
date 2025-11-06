# 👥 Usuarios de Prueba

Después de ejecutar `npm run seed`, se crean los siguientes usuarios de prueba:

## Usuarios Disponibles

### Estudiante
- **Email**: `estudiante@inacap.cl`
- **Contraseña**: `123456`
- **Rol**: Estudiante
- **Cursos inscritos**: Los primeros 3 cursos disponibles
- **Progreso**: ~30% en cada curso

### Profesor
- **Email**: `profesor@inacap.cl`
- **Contraseña**: `123456`
- **Rol**: Profesor

### Administrador
- **Email**: `admin@inacap.cl`
- **Contraseña**: `123456`
- **Rol**: Admin

## Uso

1. **Inicia el servidor**:
   ```bash
   npm start
   ```

2. **Abre el navegador** en `http://localhost:3000`

3. **Inicia sesión** con cualquiera de los usuarios arriba

4. **Explora la aplicación**:
   - Ver tus cursos inscritos en el dashboard
   - Inscribirte a nuevos cursos
   - Ver notificaciones
   - Actualizar tu perfil

## Notas

- Todos los usuarios tienen la misma contraseña: `123456`
- El estudiante ya tiene notificaciones de ejemplo
- Puedes crear más usuarios usando el endpoint de registro

