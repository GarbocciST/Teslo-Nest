import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');
  
  constructor(

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

  ) {}


  async create(createProductDto: CreateProductDto) {
    
    try {
      const product = this.productsRepository.create(createProductDto);
      await this.productsRepository.save(product);

      return product;
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // TODO: Implement pagination
  async findAll( paginationDto : PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    return await this.productsRepository.find({
      take: limit,
      skip: offset,
    });
  }

  
  async findOne(id: string) {
    const product = await this.productsRepository.findOneBy({id});
    if (!id) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  update(id: string, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  } 

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return ;
  }


  private handleDBExceptions(error: any) {

    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

}
