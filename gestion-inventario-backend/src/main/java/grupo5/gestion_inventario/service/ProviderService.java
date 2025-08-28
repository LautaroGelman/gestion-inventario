package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.ProviderCreateRequest;
import grupo5.gestion_inventario.clientpanel.dto.ProviderDto;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Provider;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.ProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProviderService {

    private final ProviderRepository providerRepo;
    private final ClientRepository clientRepo;

    public List<ProviderDto> findByClientId(Long clientId) {
        return providerRepo.findByClientId(clientId).stream()
                .map(this::toDto)
                .toList();
    }

    public ProviderDto create(Long clientId, ProviderCreateRequest req) {
        Client client = clientRepo.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));

        Provider p = new Provider();
        p.setClient(client);

        // mapeo completo
        p.setName(req.getName());
        p.setContact(req.getContact());
        p.setPhone(req.getPhone());
        p.setEmail(req.getEmail());
        p.setAddress(req.getAddress());
        p.setNotes(req.getNotes());

        p.setActive(true);

        return toDto(providerRepo.save(p));
    }

    private ProviderDto toDto(Provider p) {
        return ProviderDto.builder()
                .id(p.getId())
                .name(p.getName())
                .contact(p.getContact())
                .phone(p.getPhone())
                .email(p.getEmail())
                .address(p.getAddress())
                .notes(p.getNotes())
                .active(p.isActive())
                .build();
    }
}
