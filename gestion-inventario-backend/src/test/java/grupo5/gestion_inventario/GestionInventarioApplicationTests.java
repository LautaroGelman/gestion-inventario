package grupo5.gestion_inventario;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// ¡HEMOS ELIMINADO LA ANOTACIÓN @EnableAutoConfiguration(exclude=...)!
// Ahora Spring Test configurará una base de datos de prueba completa.
@SpringBootTest
class GestionInventarioApplicationTests {

	@Test
	void contextLoads() {
		// Este test ahora comprobará que todo el contexto arranca,
		// incluyendo la base de datos de prueba y los repositorios.
	}
}