import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/common/enums/role.enum';

export class UserResponseDTO {
  @ApiProperty()
  id: number;
  @ApiProperty()
  email: string;
  @ApiProperty()
  displayName: string;
  @ApiProperty()
  imageUrl: string;
  @ApiProperty({ enum: Role })
  role: Role;
}
