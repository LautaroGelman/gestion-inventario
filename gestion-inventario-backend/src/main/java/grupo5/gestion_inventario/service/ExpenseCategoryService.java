package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.CategoryCreateDto;
import grupo5.gestion_inventario.clientpanel.dto.CategoryUpdateDto;
import grupo5.gestion_inventario.clientpanel.dto.ExpenseCategoryDto;
import grupo5.gestion_inventario.clientpanel.model.ExpenseCategory;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseCategoryRepository;
import java.util.List;
import java.util.stream.Collectors;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExpenseCategoryService {

    private final ExpenseCategoryRepository categoryRepo;
    private final ClientRepository clientRepo;

    @Transactional
    public ExpenseCategoryDto create(Long clientId, CategoryCreateDto dto) {
        if (categoryRepo.existsByNameAndClientId(dto.name(), clientId))
            throw new IllegalArgumentException("La categoría ya existe");

        Client client = clientRepo.getReferenceById(clientId);

        ExpenseCategory cat = new ExpenseCategory();
        cat.setClient(client);
        cat.setName(dto.name());
        cat.setDefaultCategory(dto.defaultCategory());

        return ExpenseCategoryDto.fromEntity(categoryRepo.save(cat));
    }

    @Transactional
    public ExpenseCategoryDto update(Long clientId, Long id, CategoryUpdateDto dto) {
        ExpenseCategory cat = categoryRepo.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        if (dto.name() != null && !dto.name().equals(cat.getName()))
            cat.setName(dto.name());

        if (dto.defaultCategory() != null)
            cat.setDefaultCategory(dto.defaultCategory());

        return ExpenseCategoryDto.fromEntity(cat);
    }

    @Transactional
    public void deactivate(Long clientId, Long id) {
        ExpenseCategory cat = categoryRepo.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));
        cat.setActive(false); // @SQLDelete la ocultará
    }

    public List<ExpenseCategoryDto> listActive(Long clientId) {
        return categoryRepo.findByClientId(clientId)
                .stream()
                .map(ExpenseCategoryDto::fromEntity)
                .collect(Collectors.toList());
    }
}
