// src/main/java/grupo5/gestion_inventario/service/SaleReturnService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.ReturnItemDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleReturnDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleReturnRequest;
import grupo5.gestion_inventario.clientpanel.model.Sale;
import grupo5.gestion_inventario.clientpanel.model.SaleReturn;
import grupo5.gestion_inventario.clientpanel.model.SaleReturnItem;
import grupo5.gestion_inventario.clientpanel.repository.SaleRepository;
import grupo5.gestion_inventario.clientpanel.repository.SaleReturnRepository;
import grupo5.gestion_inventario.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleReturnService {

    private final SaleReturnRepository saleReturnRepository;
    private final SaleRepository       saleRepository;
    private final ProductRepository    productRepository;

    public SaleReturnService(SaleReturnRepository saleReturnRepository,
                             SaleRepository saleRepository,
                             ProductRepository productRepository) {
        this.saleReturnRepository = saleReturnRepository;
        this.saleRepository       = saleRepository;
        this.productRepository    = productRepository;
    }

    /**
     * Registra una devolución y devuelve un DTO con los detalles.
     */
    @Transactional
    public SaleReturnDto createSaleReturn(SaleReturnRequest request) {
        // 1. Recuperar la venta y validar clientId
        Sale sale = saleRepository.findByIdAndClientId(
                        request.getSaleId(),
                        request.getClientId())
                .orElseThrow(() -> new RuntimeException(
                        "Venta no encontrada con id: " + request.getSaleId()));

        // 2. Crear la devolución (cabecera)
        SaleReturn saleReturn = new SaleReturn(
                sale,
                sale.getClient(),
                LocalDateTime.now(),
                request.getReason()
        );

        // 3. Procesar cada item de devolución
        for (var itemReq : request.getItems()) {
            SaleReturnItem returnItem = sale.getItems().stream()
                    .filter(si -> si.getId().equals(itemReq.getSaleItemId()))
                    .findFirst()
                    .map(soldItem -> {
                        // Ajustar stock
                        var product = soldItem.getProduct();
                        product.setQuantity(product.getQuantity() + itemReq.getQuantity());
                        // Construir el item de devolución con el constructor correcto
                        return new SaleReturnItem(
                                saleReturn,
                                soldItem,
                                product,
                                itemReq.getQuantity(),
                                soldItem.getUnitPrice(),
                                request.getReason()
                        );
                    })
                    .orElseThrow(() -> new RuntimeException(
                            "Item de venta no encontrado con id: " + itemReq.getSaleItemId()));

            saleReturn.addItem(returnItem);
        }

        // 4. Guardar la devolución
        SaleReturn saved = saleReturnRepository.save(saleReturn);

        // 5. Mapear a DTO de respuesta
        List<ReturnItemDto> itemDtos = saved.getItems().stream()
                .map(i -> new ReturnItemDto(
                        i.getId(),
                        i.getSaleItem().getId(),
                        i.getQuantity(),
                        i.getUnitPrice()
                ))
                .collect(Collectors.toList());

        return new SaleReturnDto(
                saved.getId(),
                saved.getSale().getId(),
                saved.getReason(),
                saved.getReturnDate(),  // getter correcto de la fecha
                itemDtos
        );
    }
    @Transactional(readOnly = true)
    public List<SaleReturnDto> listReturns(Long clientId,
                                           Long saleId,
                                           LocalDateTime from,
                                           LocalDateTime to) {

        List<SaleReturn> returns = saleReturnRepository
                .findByFilters(clientId, saleId, from, to);

        return returns.stream()
                .map(sr -> new SaleReturnDto(
                        sr.getId(),
                        sr.getSale().getId(),
                        sr.getReason(),
                        sr.getReturnDate(),
                        List.of()      // para listado no enviamos items
                ))
                .collect(Collectors.toList());
    }

}
